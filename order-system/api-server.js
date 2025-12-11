const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const orderPublisher = require('./services/orderPublisher');
const redisClient = require('./services/redisClient');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `API-${process.pid}`;

app.use(bodyParser.json());

// Subscribe to status updates from workers
async function setupStatusListener() {
  await orderPublisher.subscribeToStatusUpdates(async (statusUpdate) => {
    const { orderId, status, processedBy, completedAt, error } =
      statusUpdate.data;

    console.log(`[${INSTANCE_ID}] 📬 Status update: ${orderId} -> ${status}`);

    // Broadcast to all connected clients watching this order
    io.to(`order:${orderId}`).emit('orderStatusUpdate', statusUpdate.data);

    // Store in Redis (shared across all API instances)
    await redisClient.setOrderStatus(orderId, {
      status,
      processedBy,
      completedAt,
      error,
      updatedAt: new Date().toISOString(),
    });
  });
}

// Create order endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, items, totalAmount, priority } = req.body;

    if (!customerId || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, items, totalAmount',
      });
    }

    const orderId = uuidv4();
    const order = {
      orderId,
      customerId,
      items,
      totalAmount,
      priority: priority || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: INSTANCE_ID,
    };

    await orderPublisher.publishOrder(order);
    await orderPublisher.publishOrderEvent('created', order);

    res.status(202).json({
      success: true,
      message: 'Order received and queued for processing',
      orderId,
      status: 'pending',
      statusUrl: `/api/orders/${orderId}/status`,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message,
    });
  }
});

// Get status endpoint
app.get('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const status = await redisClient.getOrderStatus(orderId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
    });
  }

  res.json({
    success: true,
    orderId,
    ...status,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instance: INSTANCE_ID,
    rabbitmq: orderPublisher.isConnected,
  });
});

// Test order page
app.get('/test-order', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Tracker</title>
      <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        #result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        #status { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 4px; }
        #status p { margin: 5px 0; }
        .status-pending { color: #856404; }
        .status-processing { color: #0c5460; }
        .status-completed { color: #155724; }
        .status-failed { color: #721c24; }
      </style>
    </head>
    <body>
      <h1>Order Status Tracker</h1>
      <button id="orderBtn" onclick="createOrder()">Create Order</button>
      <div id="result"></div>
      <div id="status"></div>

      <script>
        const socket = io('http://localhost:${PORT}');
        let currentOrderId = null;

        socket.on('orderStatusUpdate', (data) => {
          console.log('Status update:', data);
          document.getElementById('status').innerHTML = \`
            <p><strong>Order:</strong> \${data.orderId}</p>
            <p><strong>Status:</strong> <span class="status-\${data.status}">\${data.status}</span></p>
            <p><strong>Processed by:</strong> \${data.processedBy || 'N/A'}</p>
            <p><strong>Updated:</strong> \${data.completedAt || new Date().toISOString()}</p>
          \`;
        });

        async function createOrder() {
          const btn = document.getElementById('orderBtn');
          const result = document.getElementById('result');
          const status = document.getElementById('status');
          btn.disabled = true;
          btn.textContent = 'Creating...';
          status.innerHTML = '';

          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerId: 'test-customer-' + Date.now(),
                items: [{ name: 'Test Product', quantity: 1, price: 29.99 }],
                totalAmount: 29.99
              })
            });
            const data = await response.json();
            result.className = data.success ? 'success' : 'error';
            result.innerHTML = '<strong>Order ID:</strong> ' + data.orderId + '<br><strong>Status:</strong> ' + data.status;

            if (data.success) {
              currentOrderId = data.orderId;
              socket.emit('watchOrder', currentOrderId);
              status.innerHTML = '<p>Watching for status updates...</p>';
            }
          } catch (error) {
            result.className = 'error';
            result.textContent = 'Error: ' + error.message;
          } finally {
            btn.disabled = false;
            btn.textContent = 'Create Order';
          }
        }
      </script>
    </body>
    </html>
  `);
});

function connectSocketIo() {
  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Client subscribes to specific order
    socket.on('watchOrder', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Client ${socket.id} watching order ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
// Start server
async function startServer() {
  try {
    await orderPublisher.connect();
    await setupStatusListener(); // Listen for status updates
    await redisClient.connect();
    connectSocketIo();
    server.listen(PORT, () => {
      console.log(`\n🚀 API Server [${INSTANCE_ID}] running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Create Order: POST http://localhost:${PORT}/api/orders`);
      console.log(
        `   Order Status: GET http://localhost:${PORT}/api/orders/:orderId/status\n`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  await orderPublisher.close();
  process.exit(0);
});

startServer();
