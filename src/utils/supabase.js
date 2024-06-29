// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveResult = async (imageSrc, extractedText, verificationResult) => {
  const { data, error } = await supabase
    .from('student_answers')
    .insert([
      { image_url: imageSrc, extracted_text: extractedText, verification_result: verificationResult }
    ]);

  if (error) throw error;
  return data;
};
