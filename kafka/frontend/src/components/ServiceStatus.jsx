import { useState, useEffect } from 'react';
import { getServicesStatus } from '../api/orders';

const ServiceStatus = ({ wsConnected }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const result = await getServicesStatus();
      if (result.success) {
        setServices(result.services);
      }
    } catch (err) {
      console.error('Failed to load service status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'unhealthy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Service Status</h2>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-3">
          {/* WebSocket Status */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              ></div>
              <span className="font-medium">WebSocket</span>
            </div>
            <span
              className={`text-sm ${
                wsConnected ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Microservices Status */}
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}
                ></div>
                <span className="font-medium capitalize">
                  {service.name.replace('-', ' ')}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm capitalize ${
                    service.status === 'healthy'
                      ? 'text-green-600'
                      : service.status === 'offline'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {service.status}
                </span>
                <div className="text-xs text-gray-400">:{service.port}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        Auto-refreshes every 10 seconds
      </div>
    </div>
  );
};

export default ServiceStatus;
