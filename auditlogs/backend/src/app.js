import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { initializeStream } from './config/redis.js';
import auditRoutes from './routes/auditRoutes.js';
import { auditLogger } from './middleware/auditLogger.js';
import { initStreamConsumer, startConsumer } from './services/streamConsumer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Audit logger middleware (logs non-audit API requests)
app.use(auditLogger({
  excludePaths: ['/api/audit', '/health', '/socket.io']
}));

// Routes
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example protected routes (to demonstrate audit logging)
app.get('/api/users', (req, res) => {
  res.json([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.post('/api/users', (req, res) => {
  res.status(201).json({ id: '3', ...req.body });
});

app.put('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/users/:id', (req, res) => {
  res.json({ message: 'User deleted', id: req.params.id });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Initialize and start server
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Initialize Redis Stream and consumer group
    await initializeStream();

    // Initialize stream consumer with Socket.io instance
    initStreamConsumer(io);

    // Start consuming from Redis Stream (non-blocking)
    startConsumer();

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket server ready`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
