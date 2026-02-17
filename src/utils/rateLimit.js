// In-memory rate limiter
// For production with multiple instances, use Redis-based rate limiting

import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './constants';

const rateLimitMap = new Map();

// Auto-cleanup interval to prevent memory leaks
let cleanupInterval = null;

function ensureCleanupRunning() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(cleanupRateLimitMap, RATE_LIMIT_WINDOW_MS * 2);
  // Allow the process to exit even if the interval is still running
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

export function rateLimit(identifier) {
  ensureCleanupRunning();

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Get or create entry for this identifier
  let entry = rateLimitMap.get(identifier);

  if (!entry) {
    entry = { requests: [] };
    rateLimitMap.set(identifier, entry);
  }

  // Remove old requests outside the window
  entry.requests = entry.requests.filter(time => time > windowStart);

  // Check if rate limited
  if (entry.requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.requests[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }

  // Add current request
  entry.requests.push(now);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.requests.length,
    resetIn: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  };
}

export function rateLimitResponse(resetIn) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    retryAfter: resetIn
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(resetIn),
    },
  });
}

// Get client identifier from request (IP or forwarded header)
export function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Cleanup old entries to prevent memory leaks
export function cleanupRateLimitMap() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  for (const [key, entry] of rateLimitMap.entries()) {
    entry.requests = entry.requests.filter(time => time > windowStart);
    if (entry.requests.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}
