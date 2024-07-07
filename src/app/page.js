'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { extractTextFromImage, parseQuestions } from '../utils/ocr';
import { uploadImage, saveResult, saveKeyText, getKeys, deleteKey } from '../utils/supabase';
import { validateImages } from '../utils/inputValidation';

export default function Home() {
  const [keyImages, setKeyImages] = useState([]);
  const [studentImages, setStudentImages] = useState([]);
  const [keyText, setKeyText] = useState('');
  const [savedKeys, setSavedKeys] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchSavedKeys();
  }, []);

  const fetchSavedKeys = async () => {
    try {
      const keys = await getKeys();
      setSavedKeys(keys);
    } catch (error) {
      console.error('Error fetching saved keys:', error);
      setStatus('Error fetching saved keys');
    }
  };

  const handleKeyUpload = (event) => {
    try {
      const files = Array.from(event.target.files);
      validateImages(files);
      setKeyImages(files);
    } catch (error) {
      console.error('Error in handleKeyUpload:', error);
      setStatus(error.message);
    }
  };

  const handleStudentUpload = (event) => {
    try {
      const files = Array.from(event.target.files);
      validateImages(files);
      setStudentImages(files);
    } catch (error) {
      console.error('Error in handleStudentUpload:', error);
      setStatus(error.message);
    }
  };

  const processKey = async () => {
    setLoading(true);
    setStatus('Processing key...');
    setProgress(0);

    try {
      let fullKeyText = '';
      for (let i = 0; i < keyImages.length; i++) {
        const text = await extractTextFromImage(keyImages[i], updateProgress);
        fullKeyText += text + '\n';
      }
      
      const parsedQuestions = parseQuestions(fullKeyText);
      console.log('Parsed key questions:', parsedQuestions);

      const savedKey = await saveKeyText(JSON.stringify(parsedQuestions));
      console.log('Saved key:', savedKey);

      setKeyText(JSON.stringify(parsedQuestions));
      setStatus('Key processed and saved successfully.');
      fetchSavedKeys(); // Refresh the list of saved keys
    } catch (error) {
      console.error('Error processing or saving key:', error);
      setStatus(`Error processing or saving key: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const processStudentTests = async () => {
    if (!keyText) {
      setStatus('Please process a key first or select a saved key.');
      return;
    }

    setLoading(true);
    setStatus('Processing student tests...');
    setProgress(0);

    try {
      const parsedKey = JSON.parse(keyText);
      const results = [];

      for (let i = 0; i < studentImages.length; i++) {
        const studentText = await extractTextFromImage(studentImages[i], updateProgress);
        const parsedStudentAnswers = parseQuestions(studentText);
        console.log('Parsed student answers:', parsedStudentAnswers);

        const testType = 'Math Test'; // You may want to implement a more sophisticated test type detection
        const studentName = `Student ${i + 1}`; // You may want to implement a way to get the student's name

        // Send the extracted text to the /api/verify route
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ extractedText: studentText }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { result } = await response.json();
        const verificationResult = JSON.parse(result);

        const imagePath = await uploadImage(studentImages[i], `student_${i+1}_${Date.now()}.png`);
        const savedResult = await saveResult(testType, studentName, imagePath, JSON.stringify(parsedStudentAnswers), JSON.stringify(verificationResult));

        results.push({
          studentNumber: i + 1,
          testType,
          studentName,
          verificationResult,
          savedResult
        });
      }

      setResults(results);
      setStatus('All student tests processed successfully.');
    } catch (error) {
      console.error('Error processing student tests:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const updateProgress = (p) => {
    setProgress(p);
    setStatus(`Processing image... ${(p * 100).toFixed(0)}%`);
  };

  const handleDeleteKey = async (keyId) => {
    try {
      await deleteKey(keyId);
      setStatus('Key deleted successfully.');
      fetchSavedKeys(); // Refresh the list of saved keys
    } catch (error) {
      console.error('Error deleting key:', error);
      setStatus(`Error deleting key: ${error.message}`);
    }
  };

  const handleSelectKey = (keyText) => {
    setKeyText(keyText);
    setStatus('Saved key selected.');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Math Assignment Checker</h1>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Step 1: Upload or Select Answer Key</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleKeyUpload}
          className="mb-2"
        />
        <button 
          onClick={processKey}
          disabled={loading || keyImages.length === 0}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Process New Key
        </button>

        <h3 className="text-xl font-semibold mt-4 mb-2">Saved Keys:</h3>
        <ul>
          {savedKeys.map((key) => (
            <li key={key.id} className="mb-2">
              <button
                onClick={() => handleSelectKey(key.extracted_text)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
              >
                Select
              </button>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              >
                Delete
              </button>
              <span className="ml-2">Key {key.id}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Step 2: Upload Student Tests</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleStudentUpload}
          className="mb-2"
        />
        <button 
          onClick={processStudentTests}
          disabled={loading || studentImages.length === 0 || !keyText}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Process Student Tests
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
      
      {results.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Results:</h2>
          {results.map((result, index) => (
            <div key={index} className="mb-4 p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Student {result.studentNumber}</h3>
              <p className="mb-2"><strong>Test Type:</strong> {result.testType}</p>
              <p className="mb-2"><strong>Student Name:</strong> {result.studentName}</p>
              <h4 className="text-md font-semibold mt-2">Verification Results:</h4>
              {result.verificationResult.map((question, qIndex) => (
                <div key={qIndex} className={`p-2 mt-1 ${question.correct ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p><strong>Question {question.questionNumber}:</strong> {question.text}</p>
                  <p><strong>Student Answer:</strong> {question.studentAnswer}</p>
                  <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                  <p><strong>Result:</strong> {question.correct ? 'Correct' : 'Incorrect'}</p>
                  <p><strong>Explanation:</strong> {question.explanation}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}