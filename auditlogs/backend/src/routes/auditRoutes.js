import { Router } from 'express';
import {
  getLogs,
  searchLogs,
  exportLogs,
  addLog,
  getFilterOptions,
  AuditActions
} from '../services/auditService.js';

const router = Router();

/**
 * GET /api/audit/logs
 * Fetch audit logs with filtering and pagination
 */
router.get('/logs', async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      action,
      userId,
      resource,
      limit = 50,
      offset = 0
    } = req.query;

    const result = await getLogs({
      startTime,
      endTime,
      action,
      userId,
      resource,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/audit/search
 * Full-text search through audit logs
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const result = await searchLogs(q, { limit: parseInt(limit) });
    res.json(result);
  } catch (err) {
    console.error('Error searching logs:', err);
    res.status(500).json({ error: 'Failed to search audit logs' });
  }
});

/**
 * GET /api/audit/export
 * Export audit logs in CSV or JSON format
 */
router.get('/export', async (req, res) => {
  try {
    const {
      format = 'json',
      startTime,
      endTime,
      action,
      userId,
      resource
    } = req.query;

    const result = await exportLogs(format, {
      startTime,
      endTime,
      action,
      userId,
      resource
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (err) {
    console.error('Error exporting logs:', err);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

/**
 * GET /api/audit/filters
 * Get available filter options (actions, users, resources)
 */
router.get('/filters', async (req, res) => {
  try {
    const options = await getFilterOptions();
    res.json(options);
  } catch (err) {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

/**
 * POST /api/audit/log
 * Manually add an audit log entry (for testing or custom events)
 */
router.post('/log', async (req, res) => {
  try {
    const {
      userId,
      userName,
      action,
      resource,
      resourceId,
      details
    } = req.body;

    if (!action || !resource) {
      return res.status(400).json({ error: 'action and resource are required' });
    }

    if (!Object.values(AuditActions).includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${Object.values(AuditActions).join(', ')}`
      });
    }

    const logEntry = await addLog({
      userId: userId || req.headers['x-user-id'] || 'anonymous',
      userName: userName || req.headers['x-user-name'] || 'Anonymous',
      action,
      resource,
      resourceId,
      details: details || {},
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(logEntry);
  } catch (err) {
    console.error('Error creating log entry:', err);
    res.status(500).json({ error: 'Failed to create audit log entry' });
  }
});

/**
 * GET /api/audit/actions
 * Get list of valid audit actions
 */
router.get('/actions', (req, res) => {
  res.json(Object.values(AuditActions));
});

export default router;
