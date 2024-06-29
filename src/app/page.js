// src/app/page.js
'use client'; // Add this directive at the top

import React, { useState } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { extractTextFromImage } from '../utils/ocr';
import { verifyAnswers } from '../utils/openai';
import { saveResult } from '../utils/supabase';

export default function Home() {
  const [result, setResult] = useState(null);

  const handleCapture = async (imageSrc) => {
    try {
      if (!imageSrc) {
        throw new Error("No image source captured");
      }

      const extractedText = await extractTextFromImage(imageSrc);
      const verificationResult = await verifyAnswers(extractedText);
      const savedResult = await saveResult(imageSrc, extractedText, verificationResult);
      setResult(savedResult);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  return (
    <div>
      <h1>Real-time Math Assignment Checker</h1>
      <WebcamCapture onCapture={handleCapture} />
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
