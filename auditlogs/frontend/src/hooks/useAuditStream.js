import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useAuditStream() {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newLogCount, setNewLogCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to audit stream');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from audit stream');
      setIsConnected(false);
    });

    socket.on('audit:new', (logEntry) => {
      console.log('New audit log:', logEntry);
      setLogs(prev => [logEntry, ...prev]);
      setNewLogCount(prev => prev + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /**
   * Initialize logs from API data
   */
  const initializeLogs = useCallback((initialLogs) => {
    setLogs(initialLogs);
    setNewLogCount(0);
  }, []);

  /**
   * Clear the new log count indicator
   */
  const clearNewLogCount = useCallback(() => {
    setNewLogCount(0);
  }, []);

  /**
   * Prepend a log entry (for real-time updates)
   */
  const prependLog = useCallback((logEntry) => {
    setLogs(prev => [logEntry, ...prev]);
  }, []);

  return {
    logs,
    isConnected,
    newLogCount,
    initializeLogs,
    clearNewLogCount,
    prependLog
  };
}

export default useAuditStream;
