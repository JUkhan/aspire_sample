const API_BASE = '/api';

export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  return response.json();
}

export async function getOrders(limit = 50, offset = 0) {
  const response = await fetch(`${API_BASE}/orders?limit=${limit}&offset=${offset}`);
  return response.json();
}

export async function getOrder(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}`);
  return response.json();
}

export async function getOrderEvents(orderId) {
  const response = await fetch(`${API_BASE}/orders/${orderId}/events`);
  return response.json();
}

export async function cancelOrder(orderId, reason = '') {
  const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  return response.json();
}

export async function replayOrders(days = 7, topic = 'orders-replay') {
  const response = await fetch(`${API_BASE}/orders/replay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ days, topic }),
  });
  return response.json();
}

export async function getInventory() {
  const response = await fetch(`${API_BASE}/inventory`);
  return response.json();
}

export async function getAnalytics() {
  const response = await fetch(`${API_BASE}/analytics`);
  return response.json();
}

export async function getServicesStatus() {
  const response = await fetch(`${API_BASE}/services/status`);
  return response.json();
}
