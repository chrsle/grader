import { saveGradingCriteria, getGradingCriteria } from '../../../utils/supabase-server';
import { validateApiKey, unauthorizedResponse } from '../../../utils/auth';
import { rateLimit, rateLimitResponse, getClientIdentifier } from '../../../utils/rateLimit';

export async function POST(req) {
  try {
    // Check authentication
    const authResult = validateApiKey(req);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error);
    }

    // Check rate limit
    const clientId = getClientIdentifier(req);
    const rateLimitResult = rateLimit(clientId);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetIn);
    }

    const { testType, criteria } = await req.json();

    if (!testType || !criteria) {
      return new Response(JSON.stringify({ error: 'testType and criteria are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const savedCriteria = await saveGradingCriteria(testType, criteria);
    return new Response(JSON.stringify(savedCriteria), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction ? 'Internal server error' : error.message;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  try {
    // Check authentication
    const authResult = validateApiKey(req);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error);
    }

    // Check rate limit
    const clientId = getClientIdentifier(req);
    const rateLimitResult = rateLimit(clientId);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetIn);
    }

    const { searchParams } = new URL(req.url);
    const testType = searchParams.get('testType');

    if (!testType) {
      return new Response(JSON.stringify({ error: 'testType is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const criteria = await getGradingCriteria(testType);

    if (!criteria) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(criteria), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction ? 'Internal server error' : error.message;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
