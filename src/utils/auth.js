// Simple API authentication middleware
// In production, consider using a more robust auth solution like NextAuth.js or Supabase Auth

const API_KEY = process.env.API_SECRET_KEY;

export function validateApiKey(request) {
  // If no API key is configured, skip validation (development mode)
  if (!API_KEY) {
    console.warn('WARNING: No API_SECRET_KEY configured. API routes are unprotected.');
    return { valid: true };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || token !== API_KEY) {
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
