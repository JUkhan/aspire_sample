import { format } from 'date-fns';

const actionColors = {
  CREATE: '#22c55e',
  READ: '#3b82f6',
  UPDATE: '#f59e0b',
  DELETE: '#ef4444',
  LOGIN: '#8b5cf6',
  LOGOUT: '#6b7280'
};

export function AuditLogTable({ logs, loading }) {
  if (loading) {
    return <div className="loading">Loading audit logs...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="empty">No audit logs found</div>;
  }

  return (
    <div className="table-container">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id || log.streamId}>
              <td className="timestamp">
                {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
              </td>
              <td className="user">
                <span className="user-name">{log.userName}</span>
                <span className="user-id">{log.userId}</span>
              </td>
              <td>
                <span
                  className="action-badge"
                  style={{ backgroundColor: actionColors[log.action] || '#6b7280' }}
                >
                  {log.action}
                </span>
              </td>
              <td className="resource">
                <span className="resource-type">{log.resource}</span>
                {log.resourceId && (
                  <span className="resource-id">{log.resourceId}</span>
                )}
              </td>
              <td className="details">
                <DetailsCell details={log.details} />
              </td>
              <td className="ip">{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailsCell({ details }) {
  if (!details || Object.keys(details).length === 0) {
    return <span className="no-details">-</span>;
  }

  const { method, path, statusCode, ...rest } = details;

  return (
    <div className="details-content">
      {method && path && (
        <span className="http-info">
          {method} {path}
          {statusCode && <span className="status-code">[{statusCode}]</span>}
        </span>
      )}
      {Object.keys(rest).length > 0 && (
        <details className="extra-details">
          <summary>More</summary>
          <pre>{JSON.stringify(rest, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

export default AuditLogTable;
