// src/utils/ocr.js
import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageSrc) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng');
    return text;
  } catch (error) {
    console.error("Error extracting text from image", error);
    throw new Error("Error attempting to read image.");
  }
};
