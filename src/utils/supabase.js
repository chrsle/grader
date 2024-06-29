import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('supabaseUrl and supabaseKey are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveResult = async (testVersion, testName, studentName, imageSrc, extractedText, verificationResult) => {
  const { data, error } = await supabase
    .from('student_answers')
    .insert([
      { test_version: testVersion, test_name: testName, student_name: studentName, image_url: imageSrc, extracted_text: extractedText, verification_result: verificationResult }
    ]);

  if (error) throw error;
  return data;
};
