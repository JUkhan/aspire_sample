import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getAnalytics, replayOrders } from '../api/orders';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = ({ realtimeStats, events }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState(null);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await getAnalytics();
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async () => {
    setReplayLoading(true);
    setReplayResult(null);
    try {
      const result = await replayOrders(7, 'orders-replay');
      setReplayResult(result);
    } catch (err) {
      setReplayResult({ success: false, message: err.message });
    } finally {
      setReplayLoading(false);
    }
  };

  const dailyChartData = {
    labels: analytics?.dailyOrders?.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    ) || [],
    datasets: [
      {
        label: 'Orders',
        data: analytics?.dailyOrders?.map((d) => parseInt(d.orders)) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const revenueChartData = {
    labels: analytics?.dailyOrders?.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    ) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: analytics?.dailyOrders?.map((d) => parseFloat(d.revenue)) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  const statusChartData = {
    labels: ['Completed', 'Pending', 'Failed', 'Shipped'],
    datasets: [
      {
        data: [
          parseInt(analytics?.summary?.completed_orders || 0),
          parseInt(analytics?.summary?.pending_orders || 0),
          parseInt(analytics?.summary?.failed_orders || 0),
          parseInt(analytics?.summary?.shipped_orders || 0),
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(99, 102, 241, 0.8)',
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-blue-600">
            {analytics?.summary?.total_orders || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            ${parseFloat(analytics?.summary?.total_revenue || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {analytics?.summary?.completed_orders || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {analytics?.summary?.failed_orders || 0}
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      {realtimeStats && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">Real-time Statistics</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {realtimeStats.totalEvents}
              </div>
              <div className="text-xs text-gray-500">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {realtimeStats.ordersCreated}
              </div>
              <div className="text-xs text-gray-500">Orders Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {realtimeStats.paymentsProcessed}
              </div>
              <div className="text-xs text-gray-500">Payments OK</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {realtimeStats.paymentsFailed}
              </div>
              <div className="text-xs text-gray-500">Payments Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {realtimeStats.shipmentsCreated}
              </div>
              <div className="text-xs text-gray-500">Shipments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {realtimeStats.uptime}s
              </div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">Orders (Last 7 Days)</h3>
          <Line data={dailyChartData} options={{ responsive: true }} />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">Revenue (Last 7 Days)</h3>
          <Bar data={revenueChartData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">Order Status Distribution</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={statusChartData} />
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-3">Live Event Feed</h3>
          <div className="h-64 overflow-y-auto space-y-2">
            {events.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Waiting for events...
              </div>
            ) : (
              events.slice(0, 20).map((event, idx) => (
                <div
                  key={idx}
                  className="text-sm p-2 bg-gray-50 rounded flex justify-between"
                >
                  <span className="font-medium">{event.eventType}</span>
                  <span className="text-gray-500 text-xs">
                    {event.source} | {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Replay Orders Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Order Replay (Fraud Detection Testing)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Replay last 7 days of orders to the "orders-replay" topic for fraud
          detection system testing.
        </p>
        <button
          onClick={handleReplay}
          disabled={replayLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 transition"
        >
          {replayLoading ? 'Replaying...' : 'Replay Orders'}
        </button>
        {replayResult && (
          <div
            className={`mt-3 p-3 rounded ${
              replayResult.success
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {replayResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
