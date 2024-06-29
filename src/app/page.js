'use client'; // Add this directive at the top

import React, { useState } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { extractTextFromImage } from '../utils/ocr';
import { verifyAnswers } from '../utils/openai';
import { saveResult } from '../utils/supabase';

export default function Home() {
  const [result, setResult] = useState(null);
  const [testVersion, setTestVersion] = useState('');
  const [testName, setTestName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCapture = async (imageSrc) => {
    try {
      if (!imageSrc) {
        throw new Error("No image source captured");
      }

      setLoading(true);
      const extractedText = await extractTextFromImage(imageSrc);
      const verificationResult = await verifyAnswers(extractedText);
      const savedResult = await saveResult(testVersion, testName, studentName, imageSrc, extractedText, verificationResult);
      setResult(savedResult);
      setStatus('Image processed successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      setStatus('Error processing image');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setStatus('');
    setResult(null);
  };

  const resetForm = () => {
    setTestVersion('');
    setTestName('');
    setStudentName('');
    setIsScanning(false);
    setStatus('');
    setResult(null);
  };

  return (
    <div>
      <h1>Real-time Math Assignment Checker</h1>
      {!isScanning ? (
        <div>
          <label>
            Test Version:
            <input type="text" value={testVersion} onChange={(e) => setTestVersion(e.target.value)} />
          </label>
          <label>
            Test Name:
            <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} />
          </label>
          <label>
            Student Name:
            <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </label>
          <button onClick={startScanning}>Start Scanning</button>
        </div>
      ) : (
        <div>
          <WebcamCapture onCapture={handleCapture} setStatus={setStatus} />
          {status && <p>{status}</p>}
          {loading && <p>Loading...</p>}
          {result && (
            <div>
              <h2>Result:</h2>
              <pre>{JSON.stringify(result, null, 2)}</pre>
              <button onClick={resetForm}>Next User</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
