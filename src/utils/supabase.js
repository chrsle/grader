import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const uploadImage = async (file, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('student_tests')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicURLData, error: publicURLError } = supabase.storage
      .from('student_tests')
      .getPublicUrl(fileName);

    if (publicURLError) throw publicURLError;

    return publicURLData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

export const saveResult = async (testType, studentName, imagePath, studentAnswers, verificationResult) => {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .insert({
        test_type: testType,
        student_name: studentName,
        image_path: imagePath,
        student_answers: studentAnswers,
        verification_result: verificationResult,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveResult:', error);
    throw error;
  }
};

export const saveKeyText = async (keyText) => {
  try {
    const { data, error } = await supabase
      .from('answer_keys')
      .insert({ extracted_text: keyText });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveKeyText:', error);
    throw error;
  }
};

export const getKeys = async () => {
  try {
    const { data, error } = await supabase
      .from('answer_keys')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getKeys:', error);
    throw error;
  }
};

export const deleteKey = async (keyId) => {
  try {
    const { data, error } = await supabase
      .from('answer_keys')
      .delete()
      .eq('id', keyId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in deleteKey:', error);
    throw error;
  }
};

export const saveGradingCriteria = async (testType, criteria) => {
  try {
    const { data, error } = await supabase
      .from('grading_criteria')
      .upsert({ test_type: testType, criteria }, { onConflict: 'test_type' });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveGradingCriteria:', error);
    throw error;
  }
};

export const getGradingCriteria = async (testType) => {
  console.log('getGradingCriteria called with testType:', testType);
  try {
    const { data, error } = await supabase
      .from('grading_criteria')
      .select('criteria')
      .eq('test_type', testType)
      .maybeSingle();

    if (error) {
      console.error('Supabase error in getGradingCriteria:', error);
      throw error;
    }

    console.log('Raw data from Supabase:', data);

    if (!data || !data.criteria) {
      console.log('No criteria found for testType:', testType);
      return null;
    }

    return data.criteria;
  } catch (error) {
    console.error('Error in getGradingCriteria:', error);
    return null;
  }
};