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

    console.log('Image uploaded successfully:', data);
    return data.path;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

export const saveResult = async (testType, studentName, imagePath, extractedText, verificationResult) => {
  console.log('Starting saveResult function');
  try {
    console.log('Inserting data into student_answers table');
    const { data, error } = await supabase
      .from('student_answers')
      .insert([
        { 
          test_type: testType,
          student_name: studentName,
          image_data: imagePath,
          extracted_text: extractedText,
          verification_result: verificationResult
        }
      ])
      .select();

    if (error) throw error;

    console.log('Data inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveResult:', error);
    throw error;
  }
};

export const saveKeyText = async (extractedText) => {
  try {
    const { data, error } = await supabase
      .from('keys')
      .insert([{ extracted_text: extractedText }])
      .select();

    if (error) throw error;

    console.log('Key text saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving key text:', error);
    throw error;
  }
};

// Function to retrieve saved keys
export const getKeys = async () => {
  try {
    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('Retrieved keys:', data);
    return data;
  } catch (error) {
    console.error('Error retrieving keys:', error);
    throw error;
  }
};

// Function to delete a key
export const deleteKey = async (keyId) => {
  try {
    const { data, error } = await supabase
      .from('keys')
      .delete()
      .match({ id: keyId });

    if (error) throw error;

    console.log('Key deleted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error deleting key:', error);
    throw error;
  }
};