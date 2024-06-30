'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { extractTextFromImage } from '../utils/ocr';
import { verifyAnswers } from '../utils/openai';
import { uploadImage, saveResult } from '../utils/supabase';

export default function Home() {
  const [result, setResult] = useState(null);
  const [testVersion, setTestVersion] = useState('');
  const [testName, setTestName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);

  useEffect(() => {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupabaseAvailable(false);
      console.warn('Supabase environment variables are missing. Results will not be saved to the database.');
    }
  }, []);

  const handleImageUpload = (event) => {
    console.log('Image upload event triggered');
    const file = event.target.files[0];
    console.log('Uploaded file:', file);
    setUploadedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProcessImage = async () => {
    console.log('Process image function started');
    if (!uploadedImage) {
      console.log('No image uploaded');
      setStatus('Please upload an image first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Processing image...');
      setProgress(0);
      console.log('Starting image processing...');

      // Upload image to Supabase storage
      const fileName = `${Date.now()}_${uploadedImage.name}`;
      const imagePath = await uploadImage(uploadedImage, fileName);
      if (!imagePath) {
        throw new Error('Failed to upload image to storage. Please check your Supabase configuration.');
      }
      console.log('Image uploaded successfully. Path:', imagePath);

      console.log('Calling extractTextFromImage');
      let extractedQuestions;
      try {
        extractedQuestions = await extractTextFromImage(uploadedImage, (p) => {
          setProgress(p);
          setStatus(`Processing image... ${(p * 100).toFixed(0)}%`);
        });
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        throw new Error(`OCR failed: ${ocrError.message}`);
      }
      console.log('Extracted Questions:', extractedQuestions);

      if (!extractedQuestions || extractedQuestions.length === 0) {
        throw new Error('No text could be extracted from the image');
      }

      const results = [];
      for (const question of extractedQuestions) {
        console.log(`Calling verifyAnswers for question ${question.questionNumber}`);
        const verificationResult = await verifyAnswers(question.questionText);
        console.log(`Verification Result for question ${question.questionNumber}:`, verificationResult);

        let savedResult = null;
        if (supabaseAvailable) {
          console.log('Calling saveResult');
          savedResult = await saveResult(
            testVersion,
            testName,
            studentName,
            imagePath,
            question.questionText,
            verificationResult,
            question.questionNumber
          );
          console.log(`Saved Result for question ${question.questionNumber}:`, savedResult);
        } else {
          console.log('Supabase is not available. Result not saved to database.');
        }

        results.push({
          questionNumber: question.questionNumber,
          extractedText: question.questionText,
          verificationResult,
          savedResult: savedResult || 'Failed to save to database'
        });
      }

      setResult(results);
      setStatus(supabaseAvailable && results.every(r => r.savedResult !== 'Failed to save to database') 
        ? 'Image processed and all questions saved successfully' 
        : 'Image processed successfully. Some or all results may not have been saved to the database.');
    } catch (error) {
      console.error('Error processing image:', error);
      console.error('Error stack:', error.stack);
      setStatus(`Error: ${error.message}`);
      setResult(null);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Real-time Math Assignment Checker</h1>
      
      {!supabaseAvailable && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Warning</p>
          <p>Supabase is not configured. Results will not be saved to the database.</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="mb-4">
          <label htmlFor="testVersion" className="block text-sm font-medium text-gray-700">Test Version:</label>
          <input
            id="testVersion"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
            type="text"
            value={testVersion}
            onChange={(e) => setTestVersion(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="testName" className="block text-sm font-medium text-gray-700">Test Name:</label>
          <input
            id="testName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Student Name:</label>
          <input
            id="studentName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-900"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">Upload Image:</label>
          <input
            id="imageUpload"
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleProcessImage} 
          disabled={loading || !uploadedImage}
        >
          {loading ? 'Processing...' : 'Process Image'}
        </button>
      </div>
      
      {status && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">{status}</p>
          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress * 100}%`}}></div>
            </div>
          )}
        </div>
      )}
      
      {imagePreview && (
        <div className="mb-6 mt-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Uploaded Image:</h2>
          <div className="relative w-full h-64">
            <Image
              src={imagePreview}
              alt="Uploaded"
              fill
              style={{objectFit: 'contain'}}
            />
          </div>
        </div>
      )}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Results:</h2>
          {result.map((questionResult, index) => (
            <div key={index} className="mb-4 p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Question {questionResult.questionNumber}</h3>
              <p className="mb-2"><strong>Extracted Text:</strong> {questionResult.extractedText}</p>
              <p className="mb-2"><strong>Verification Result:</strong> {questionResult.verificationResult}</p>
              <p className="mb-2"><strong>Saved Result:</strong> {JSON.stringify(questionResult.savedResult)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}