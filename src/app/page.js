'use client';

import React, { useState } from 'react';
import { extractTextFromImage } from '../utils/ocr';
import { verifyAnswers } from '../utils/openai';
import { saveResult } from '../utils/supabase';
import styles from './page.module.css';

export default function Home() {
  const [result, setResult] = useState(null);
  const [testVersion, setTestVersion] = useState('');
  const [testName, setTestName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!uploadedImage) {
      setStatus('Please upload an image first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Processing image...');
      const extractedText = await extractTextFromImage(uploadedImage);
      const verificationResult = await verifyAnswers(extractedText);
      const savedResult = await saveResult(testVersion, testName, studentName, uploadedImage, extractedText, verificationResult);
      setResult(savedResult);
      setStatus('Image processed successfully');
    } catch (error) {
      console.error('Error processing image:', error.message);
      setStatus(`Error processing image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Real-time Math Assignment Checker</h1>
      <div>
        <div className={styles.formGroup}>
          <label htmlFor="testVersion" className={styles.label}>Test Version:</label>
          <input
            id="testVersion"
            className={styles.input}
            type="text"
            value={testVersion}
            onChange={(e) => setTestVersion(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="testName" className={styles.label}>Test Name:</label>
          <input
            id="testName"
            className={styles.input}
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="studentName" className={styles.label}>Student Name:</label>
          <input
            id="studentName"
            className={styles.input}
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="imageUpload" className={styles.label}>Upload Image:</label>
          <input
            id="imageUpload"
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        <button className={styles.button} onClick={handleProcessImage}>Process Image</button>
      </div>
      {status && <p>{status}</p>}
      {loading && <p>Loading...</p>}
      {uploadedImage && (
        <div style={{ marginTop: '20px' }}>
          <img
            src={uploadedImage}
            alt="Uploaded"
            style={{ width: '100%' }}
          />
        </div>
      )}
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
