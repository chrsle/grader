import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageFile, progressCallback) => {
  console.log('Starting extractTextFromImage function');
  console.log('Image file:', imageFile);

  try {
    console.log('Converting File to base64');
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('File read successfully');
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      reader.readAsDataURL(imageFile);
    });
    console.log('Base64 conversion complete');

    console.log('Starting text recognition');
    const result = await Tesseract.recognize(base64Image, 'eng', {
      logger: m => {
        console.log(m);
        if (m.status === 'recognizing text') {
          progressCallback(m.progress);
        }
      }
    });
    console.log('Text recognition complete');

    const text = result.data.text;
    console.log('Extracted text:', text);

    // Split the extracted text into questions
    const questions = text.split(/\d+\)/).filter(q => q.trim() !== '');

    return questions.map((q, index) => ({
      questionNumber: index + 1,
      questionText: q.trim()
    }));
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};