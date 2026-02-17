// API authentication middleware
import { timingSafeEqual } from 'crypto';

const API_KEY = process.env.API_SECRET_KEY;

/**
 * Perform a timing-safe string comparison to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function validateApiKey(request) {
  // If no API key is configured, skip validation (development mode only)
  if (!API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Server authentication is not configured' };
    }
    return { valid: true };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !safeCompare(token, API_KEY)) {
    return { valid: false, error: 'Invalid API key' };
  }

  return { valid: true };
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
