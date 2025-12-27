import { useState, useEffect } from 'react';
import { getOrders, getOrderEvents } from '../api/orders';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  payment_processing: 'bg-blue-100 text-blue-800',
  payment_completed: 'bg-green-100 text-green-800',
  payment_failed: 'bg-red-100 text-red-800',
  inventory_reserved: 'bg-purple-100 text-purple-800',
  inventory_failed: 'bg-red-100 text-red-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-200 text-green-900',
  cancelled: 'bg-gray-100 text-gray-800',
};

const OrderList = ({ refreshTrigger }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderEvents, setOrderEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [refreshTrigger]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const result = await getOrders(50);
      if (result.success) {
        setOrders(result.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderEvents = async (orderId) => {
    setLoadingEvents(true);
    try {
      const result = await getOrderEvents(orderId);
      if (result.success) {
        setOrderEvents(result.events);
      }
    } catch (err) {
      console.error('Failed to load order events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleOrderClick = async (order) => {
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
      setOrderEvents([]);
    } else {
      setSelectedOrder(order);
      await loadOrderEvents(order.id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Orders</h2>
        <button
          onClick={loadOrders}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No orders yet</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id}>
              <div
                onClick={() => handleOrderClick(order)}
                className={`border rounded p-3 cursor-pointer transition ${
                  selectedOrder?.id === order.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-sm text-gray-600">
                      {order.id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100'
                      }`}
                    >
                      {order.status}
                    </span>
                    <div className="text-lg font-bold mt-1">
                      ${parseFloat(order.total).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatDate(order.created_at)}
                </div>
              </div>

              {/* Order Events Timeline */}
              {selectedOrder?.id === order.id && (
                <div className="ml-4 mt-2 border-l-2 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-2">Event Timeline</h4>
                  {loadingEvents ? (
                    <div className="text-sm text-gray-500">Loading events...</div>
                  ) : orderEvents.length === 0 ? (
                    <div className="text-sm text-gray-500">No events recorded</div>
                  ) : (
                    <div className="space-y-2">
                      {orderEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-sm flex items-start gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                          <div>
                            <div className="font-medium">{event.event_type}</div>
                            <div className="text-xs text-gray-500">
                              {event.service_name} - {formatDate(event.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;
