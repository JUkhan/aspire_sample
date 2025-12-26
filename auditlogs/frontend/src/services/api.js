import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/audit';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch audit logs with filters and pagination
 */
export async function getLogs(params = {}) {
  const response = await api.get('/logs', { params });
  return response.data;
}

/**
 * Search audit logs
 */
export async function searchLogs(query, limit = 50) {
  const response = await api.get('/search', {
    params: { q: query, limit }
  });
  return response.data;
}

/**
 * Export audit logs
 */
export async function exportLogs(format, filters = {}) {
  const response = await api.get('/export', {
    params: { format, ...filters },
    responseType: 'blob'
  });

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition'];
  let filename = `audit-logs.${format}`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) filename = match[1];
  }

  // Create download link
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get filter options
 */
export async function getFilterOptions() {
  const response = await api.get('/filters');
  return response.data;
}

/**
 * Get available audit actions
 */
export async function getActions() {
  const response = await api.get('/actions');
  return response.data;
}

/**
 * Manually add an audit log (for testing)
 */
export async function addLog(logData) {
  const response = await api.post('/log', logData);
  return response.data;
}

export default {
  getLogs,
  searchLogs,
  exportLogs,
  getFilterOptions,
  getActions,
  addLog
};
