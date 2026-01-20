import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageFile, progressCallback) => {
  try {
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(imageFile);
    });

    const result = await Tesseract.recognize(base64Image, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && typeof progressCallback === 'function') {
          progressCallback(m.progress);
        }
      }
    });

    return result.data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

export const parseQuestions = (text) => {
  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;

  const questionRegex = /^(\d+[\.\)])\s*(.*)/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(questionRegex);

    if (match) {
      // This line starts a new question
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        number: match[1].replace(/[\.\)]$/, ''),  // Remove the period or parenthesis
        text: match[2],
        answer: ''
      };
    } else if (currentQuestion) {
      // This line is part of the current question
      if (trimmedLine.toLowerCase().startsWith('answer:')) {
        currentQuestion.answer = trimmedLine.replace(/^answer:/i, '').trim();
      } else {
        // If it's not an answer line, add it to the question text
        currentQuestion.text += ' ' + trimmedLine;
      }
    }
  }

  // Add the last question if there is one
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
};