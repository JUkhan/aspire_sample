import { v4 as uuidv4 } from 'uuid';
import { redis, STREAM_KEY } from '../config/redis.js';

export const AuditActions = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
};

/**
 * Add a new audit log entry to Redis Stream
 */
export async function addLog(event) {
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: event.userId || 'anonymous',
    userName: event.userName || 'Anonymous User',
    action: event.action || 'UNKNOWN',
    resource: event.resource || 'unknown',
    resourceId: event.resourceId || null,
    details: event.details || {},
    ipAddress: event.ipAddress || 'unknown',
    userAgent: event.userAgent || 'unknown'
  };

  // Add to Redis Stream using XADD
  const entryId = await redis.xadd(
    STREAM_KEY,
    '*', // Auto-generate ID
    'data', JSON.stringify(logEntry)
  );

  return { ...logEntry, streamId: entryId };
}

/**
 * Get logs with filtering and pagination
 */
export async function getLogs(options = {}) {
  const {
    startTime,
    endTime,
    action,
    userId,
    resource,
    limit = 50,
    offset = 0
  } = options;

  // Convert timestamps to Redis Stream IDs
  const start = startTime ? new Date(startTime).getTime() : '-';
  const end = endTime ? new Date(endTime).getTime() : '+';

  // Fetch more than needed for filtering
  const fetchLimit = (limit + offset) * 2;

  // Use XREVRANGE for newest first
  const results = await redis.xrevrange(STREAM_KEY, end, start, 'COUNT', fetchLimit);

  let logs = results.map(([streamId, fields]) => {
    const data = JSON.parse(fields[1]);
    return { ...data, streamId };
  });

  // Apply filters
  if (action) {
    logs = logs.filter(log => log.action === action);
  }
  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }
  if (resource) {
    logs = logs.filter(log => log.resource === resource);
  }

  // Apply pagination
  const total = logs.length;
  logs = logs.slice(offset, offset + limit);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + logs.length < total
  };
}

/**
 * Search logs by text in details or userName
 */
export async function searchLogs(query, options = {}) {
  const { limit = 50 } = options;
  const searchTerm = query.toLowerCase();

  // Fetch recent logs for searching
  const results = await redis.xrevrange(STREAM_KEY, '+', '-', 'COUNT', 1000);

  let logs = results
    .map(([streamId, fields]) => {
      const data = JSON.parse(fields[1]);
      return { ...data, streamId };
    })
    .filter(log => {
      const detailsStr = JSON.stringify(log.details).toLowerCase();
      const userName = (log.userName || '').toLowerCase();
      const resource = (log.resource || '').toLowerCase();
      const action = (log.action || '').toLowerCase();

      return (
        detailsStr.includes(searchTerm) ||
        userName.includes(searchTerm) ||
        resource.includes(searchTerm) ||
        action.includes(searchTerm)
      );
    })
    .slice(0, limit);

  return { logs, total: logs.length };
}

/**
 * Export logs in specified format
 */
export async function exportLogs(format, filters = {}) {
  const { logs } = await getLogs({ ...filters, limit: 10000 });

  if (format === 'json') {
    return {
      contentType: 'application/json',
      data: JSON.stringify(logs, null, 2),
      filename: `audit-logs-${Date.now()}.json`
    };
  }

  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'userId', 'userName', 'action', 'resource', 'resourceId', 'details', 'ipAddress', 'userAgent'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = headers.map(header => {
        let value = log[header];
        if (header === 'details') {
          value = JSON.stringify(value);
        }
        // Escape quotes and wrap in quotes
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvRows.push(row.join(','));
    }

    return {
      contentType: 'text/csv',
      data: csvRows.join('\n'),
      filename: `audit-logs-${Date.now()}.csv`
    };
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Get unique values for filters
 */
export async function getFilterOptions() {
  const results = await redis.xrevrange(STREAM_KEY, '+', '-', 'COUNT', 1000);

  const actions = new Set();
  const users = new Map();
  const resources = new Set();

  results.forEach(([, fields]) => {
    const data = JSON.parse(fields[1]);
    actions.add(data.action);
    users.set(data.userId, data.userName);
    resources.add(data.resource);
  });

  return {
    actions: Array.from(actions),
    users: Array.from(users.entries()).map(([id, name]) => ({ id, name })),
    resources: Array.from(resources)
  };
}
