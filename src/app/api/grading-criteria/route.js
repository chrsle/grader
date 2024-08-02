import { saveGradingCriteria, getGradingCriteria } from '../../../utils/supabase';

export async function POST(req) {
  try {
    const { testType, criteria } = await req.json();
    const savedCriteria = await saveGradingCriteria(testType, criteria);
    return new Response(JSON.stringify(savedCriteria), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving grading criteria:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const testType = searchParams.get('testType');
    
    if (!testType) {
      throw new Error('testType is required');
    }

    console.log('Fetching grading criteria for testType:', testType);
    
    const criteria = await getGradingCriteria(testType);
    
    console.log('Fetched criteria:', criteria);

    if (!criteria) {
      console.log('No criteria found for testType:', testType);
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
    console.error('Error getting grading criteria:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}