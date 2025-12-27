import { useState } from 'react';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import ServiceStatus from './components/ServiceStatus';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import useWebSocket from './hooks/useWebSocket';

function App() {
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isConnected, events, stats } = useWebSocket();

  const handleOrderCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const tabs = [
    { id: 'orders', label: 'Orders' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                E-commerce Order Processing
              </h1>
              <p className="text-sm text-gray-500">
                Kafka Event-Driven Architecture Demo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Form & List */}
            <div className="lg:col-span-2 space-y-6">
              <OrderForm onOrderCreated={handleOrderCreated} />
              <OrderList refreshTrigger={refreshTrigger} />
            </div>

            {/* Right Column - Service Status */}
            <div>
              <ServiceStatus wsConnected={isConnected} />

              {/* Recent Events */}
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Recent Events</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Waiting for events...
                    </p>
                  ) : (
                    events.slice(0, 15).map((event, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-gray-50 rounded text-sm border-l-4 border-blue-500"
                      >
                        <div className="font-medium">{event.eventType}</div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>{event.source}</span>
                          <span>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard realtimeStats={stats} events={events} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>
            Kafka Topics: orders | payments | inventory | shipping |
            orders-replay
          </p>
          <p className="mt-1">
            API Gateway: :4000 | Payment: :4001 | Inventory: :4002 | Shipping:
            :4003 | Analytics: :4004
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
