import { addLog, AuditActions } from '../services/auditService.js';

/**
 * Map HTTP methods to audit actions
 */
const methodToAction = {
  GET: AuditActions.READ,
  POST: AuditActions.CREATE,
  PUT: AuditActions.UPDATE,
  PATCH: AuditActions.UPDATE,
  DELETE: AuditActions.DELETE
};

/**
 * Extract resource information from URL path
 */
function parseResource(path) {
  // Remove query string and leading slash
  const cleanPath = path.split('?')[0].replace(/^\//, '');
  const parts = cleanPath.split('/');

  // Skip api prefix if present
  const startIndex = parts[0] === 'api' ? 1 : 0;

  return {
    resource: parts[startIndex] || 'unknown',
    resourceId: parts[startIndex + 1] || null
  };
}

/**
 * Audit logger middleware
 * Captures and logs user actions for non-audit endpoints
 */
export function auditLogger(options = {}) {
  const {
    excludePaths = ['/api/audit', '/health', '/favicon.ico'],
    excludeMethods = ['OPTIONS', 'HEAD']
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths and methods
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    const shouldExclude = excludePaths.some(path => req.path.startsWith(path));
    if (shouldExclude) {
      return next();
    }

    // Capture response to include status in log
    const originalSend = res.send;
    let responseLogged = false;

    res.send = function (body) {
      if (!responseLogged) {
        responseLogged = true;

        const { resource, resourceId } = parseResource(req.path);
        const action = methodToAction[req.method] || 'UNKNOWN';

        // Log the action asynchronously (don't block response)
        addLog({
          userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
          userName: req.user?.name || req.headers['x-user-name'] || 'Anonymous',
          action,
          resource,
          resourceId,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
            body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
          },
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent']
        }).catch(err => {
          console.error('Failed to log audit event:', err);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Remove sensitive fields from request body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Helper to manually log specific actions
 */
export function logAction(action, details) {
  return async (req, res, next) => {
    await addLog({
      userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
      userName: req.user?.name || req.headers['x-user-name'] || 'Anonymous',
      action,
      resource: details.resource || 'system',
      resourceId: details.resourceId,
      details: details.data || {},
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    });
    next();
  };
}

export default auditLogger;
