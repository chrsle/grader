import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'assignment-images';

export const uploadImage = async (file, fileName) => {
  try {
    // Check if bucket exists, if not, create it
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, { public: false });
      if (createError) throw createError;
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);

    if (error) throw error;

    return data.path;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

export const saveResult = async (testVersion, testName, studentName, imagePath, extractedText, verificationResult, questionNumber) => {
  console.log('Starting saveResult function');
  try {
    console.log('Inserting data into student_answers table');
    const { data, error } = await supabase
      .from('student_answers')
      .insert([
        { 
          test_version: testVersion,
          test_name: testName,
          student_name: studentName,
          image_data: imagePath,
          extracted_text: extractedText,
          verification_result: verificationResult,
          question_number: questionNumber
        }
      ])
      .select();

    if (error) throw error;

    console.log('Data inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveResult:', error);
    return null;
  }
};