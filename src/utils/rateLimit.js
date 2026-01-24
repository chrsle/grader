// Simple in-memory rate limiter
// For production with multiple instances, use Redis-based rate limiting

const rateLimitMap = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 20; // Max requests per window

export function rateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get or create entry for this identifier
  let entry = rateLimitMap.get(identifier);

  if (!entry) {
    entry = { requests: [], blocked: false };
    rateLimitMap.set(identifier, entry);
  }

  // Remove old requests outside the window
  entry.requests = entry.requests.filter(time => time > windowStart);

  // Check if rate limited
  if (entry.requests.length >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.requests[0] + WINDOW_MS - now) / 1000),
    };
  }

  // Add current request
  entry.requests.push(now);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.requests.length,
    resetIn: Math.ceil(WINDOW_MS / 1000),
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

// Cleanup old entries periodically (call this in a background job in production)
export function cleanupRateLimitMap() {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [key, entry] of rateLimitMap.entries()) {
    entry.requests = entry.requests.filter(time => time > windowStart);
    if (entry.requests.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}
