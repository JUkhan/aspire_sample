import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { orderApi } from '../services/api';
import type { OrderStatusUpdate } from '../types';

// Get order-api URL for Socket.IO (direct connection, not through API Gateway)
const ORDER_API_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:3000';

interface OrderHistory {
  orderId: string;
  status: OrderStatusUpdate['status'];
  createdAt: string;
  processedBy?: string;
  completedAt?: string;
  processingTime?: number;
  error?: string;
}

export default function Orders() {
  const [isCreating, setIsCreating] = useState(false);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.IO directly to order-api (not through API Gateway)
    console.log('Connecting to order-api Socket.IO:', ORDER_API_URL);
    socketRef.current = io(ORDER_API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to order status updates');
    });

    socketRef.current.on('orderStatusUpdate', (data: OrderStatusUpdate) => {
      console.log('Status update:', data);
      setOrders(prev => prev.map(order =>
        order.orderId === data.orderId
          ? {
              ...order,
              status: data.status,
              processedBy: data.processedBy,
              completedAt: data.completedAt,
              processingTime: data.processingTime,
              error: data.error,
            }
          : order
      ));
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from order status updates');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createOrder = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await orderApi.createOrder({
        customerId: `customer-${Date.now()}`,
        items: [{ name: 'Test Product', quantity: 1, price: 29.99 }],
        totalAmount: 29.99,
      });

      if (response.success) {
        const newOrder: OrderHistory = {
          orderId: response.orderId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setOrders(prev => [newOrder, ...prev]);

        // Subscribe to updates for this order
        socketRef.current?.emit('watchOrder', response.orderId);
      } else {
        setError('Failed to create order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusClass = (status: OrderStatusUpdate['status']) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      case 'retrying': return 'status-retrying';
      default: return '';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <div className="orders-page">
      <h1>Order Status Tracker</h1>

      <div className="order-actions">
        <button
          className="btn-primary"
          onClick={createOrder}
          disabled={isCreating}
          style={{ width: 'auto', padding: '0.75rem 2rem' }}
        >
          {isCreating ? 'Creating...' : 'Create Order'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {orders.length > 0 && (
        <div className="orders-list">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Processed By</th>
                <th>Completed</th>
                <th>Processing Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.orderId}>
                  <td><code>{order.orderId.substring(0, 8)}...</code></td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{formatTime(order.createdAt)}</td>
                  <td>{order.processedBy || '-'}</td>
                  <td>{formatTime(order.completedAt)}</td>
                  <td>{order.processingTime ? `${order.processingTime}ms` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.length === 0 && (
        <div className="empty-state">
          <p>No orders yet. Click "Create Order" to start.</p>
        </div>
      )}
    </div>
  );
}
