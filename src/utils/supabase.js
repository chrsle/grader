import { createClient } from '@supabase/supabase-js';
import { SUPABASE_STORAGE_BUCKET } from './constants';

// Client-side Supabase client (uses public anon key)
// Lazy initialization to avoid crashes when env vars are missing during build/SSR
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY');
    }

    // SECURITY: Use anon key for client-side operations
    // Service role key should only be used in server-side API routes
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export const uploadImage = async (file, fileName) => {
  const client = getSupabaseClient();

  const { data, error } = await client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(fileName, file);

  if (error) throw error;

  const { data: publicURLData, error: publicURLError } = client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(fileName);

  if (publicURLError) throw publicURLError;

  return publicURLData.publicUrl;
};

export const saveResult = async (testType, studentName, imagePath, studentAnswers, verificationResult) => {
  const { data, error } = await getSupabaseClient()
    .from('test_results')
    .insert({
      test_type: testType,
      student_name: studentName,
      image_path: imagePath,
      student_answers: studentAnswers,
      verification_result: verificationResult,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveKeyText = async (keyText) => {
  const { data, error } = await getSupabaseClient()
    .from('answer_keys')
    .insert({ extracted_text: keyText })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getKeys = async () => {
  const { data, error } = await getSupabaseClient()
    .from('answer_keys')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

export const deleteKey = async (keyId) => {
  const { data, error } = await getSupabaseClient()
    .from('answer_keys')
    .delete()
    .eq('id', keyId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
