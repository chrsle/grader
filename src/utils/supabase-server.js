import { createClient } from '@supabase/supabase-js';

// SECURITY: This client uses the service role key and should ONLY be used
// in server-side API routes, never in client-side code

// Lazy initialization to avoid crashes when env vars are missing
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase server environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

export const saveGradingCriteria = async (testType, criteria) => {
  const { data, error } = await getSupabaseAdmin()
    .from('grading_criteria')
    .upsert({ test_type: testType, criteria }, { onConflict: 'test_type' });

  if (error) throw error;
  return data;
};

export const getGradingCriteria = async (testType) => {
  const { data, error } = await getSupabaseAdmin()
    .from('grading_criteria')
    .select('criteria')
    .eq('test_type', testType)
    .maybeSingle();

  if (error) throw error;

  if (!data || !data.criteria) {
    return null;
  }

  return data.criteria;
};
