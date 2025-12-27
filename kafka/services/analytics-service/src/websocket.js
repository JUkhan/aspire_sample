const WebSocket = require('ws');

let wss = null;
const clients = new Set();

function createWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Analytics Service: New WebSocket client connected');
    clients.add(ws);

    // Send welcome message with current stats
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to Analytics Service',
      timestamp: new Date().toISOString(),
    }));

    ws.on('close', () => {
      console.log('Analytics Service: WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('Analytics Service: WebSocket error:', error);
      clients.delete(ws);
    });
  });

  console.log('Analytics Service: WebSocket server initialized');
  return wss;
}

function broadcast(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`Analytics Service: Broadcasted to ${sentCount} clients`);
  }
}

function broadcastEvent(event) {
  broadcast({
    type: 'EVENT',
    event: {
      eventType: event.eventType,
      orderId: event.payload?.orderId,
      timestamp: event.timestamp,
      source: event.metadata?.source,
      data: event.payload,
    },
  });
}

function broadcastStats(stats) {
  broadcast({
    type: 'STATS_UPDATE',
    stats,
    timestamp: new Date().toISOString(),
  });
}

function getConnectedClientsCount() {
  return clients.size;
}

module.exports = {
  createWebSocketServer,
  broadcast,
  broadcastEvent,
  broadcastStats,
  getConnectedClientsCount,
};
