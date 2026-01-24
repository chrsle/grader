'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseQuestions } from '../utils/ocr';
import { uploadImage, saveResult, saveKeyText, getKeys, deleteKey } from '../utils/supabase';
import { validateImages } from '../utils/inputValidation';
import { processImagesInParallel } from '../utils/imageProcessing';
import KeyQuestions from '../components/KeyQuestions';

export default function Home() {
  const [keyImages, setKeyImages] = useState([]);
  const [studentImages, setStudentImages] = useState([]);
  const [keyText, setKeyText] = useState('');
  const [parsedKeyQuestions, setParsedKeyQuestions] = useState([]);
  const [savedKeys, setSavedKeys] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keyProcessed, setKeyProcessed] = useState(false);
  const [testProcessed, setTestProcessed] = useState(false);

  useEffect(() => {
    fetchSavedKeys();
  }, []);

  const fetchSavedKeys = async () => {
    try {
      const keys = await getKeys();
      setSavedKeys(keys);
    } catch (error) {
      // console.error('Error fetching saved keys:', error);
      setStatus('Error fetching saved keys');
    }
  };

  const handleKeyUpload = (event) => {
    try {
      const files = Array.from(event.target.files);
      validateImages(files);
      setKeyImages(files);
      setKeyProcessed(false);
    } catch (error) {
      // console.error('Error in handleKeyUpload:', error);
      setStatus(error.message);
    }
  };

  const handleStudentUpload = (event) => {
    try {
      const files = Array.from(event.target.files);
      validateImages(files);
      setStudentImages(files);
      setTestProcessed(false);
    } catch (error) {
      // console.error('Error in handleStudentUpload:', error);
      setStatus(error.message);
    }
  };

  const processKey = async () => {
    setLoading(true);
    setStatus('Processing key...');
    setProgress(0);

    try {
      const texts = await processImagesInParallel(keyImages, (progress) => {
        setProgress(progress);
        setStatus(`Processing key... ${Math.round(progress * 100)}%`);
      });

      const fullKeyText = texts.join('\n');
      
      const parsedQuestions = parseQuestions(fullKeyText);
      // console.log('Parsed key questions:', parsedQuestions);

      setStatus('Saving key...');
      const savedKey = await saveKeyText(JSON.stringify(parsedQuestions));
      // console.log('Saved key:', savedKey);

      setKeyText(JSON.stringify(parsedQuestions));
      setParsedKeyQuestions(parsedQuestions);
      setKeyProcessed(true);
      setStatus('Key processed and saved successfully.');
      fetchSavedKeys();
    } catch (error) {
      // console.error('Error processing or saving key:', error);
      setStatus(`Error processing or saving key: ${error.message}`);
      setKeyProcessed(false);
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

      const texts = await processImagesInParallel(studentImages, (progress) => {
        setProgress(progress);
        setStatus(`Processing student tests... ${Math.round(progress * 100)}%`);
      });

      for (let i = 0; i < texts.length; i++) {
        const studentText = texts[i];
        const parsedStudentAnswers = parseQuestions(studentText);
        // console.log('Parsed student answers:', parsedStudentAnswers);

        const testType = 'Math Test';
        const studentName = `Student ${i + 1}`;

        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ extractedText: studentText, keyText }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const verificationResult = data.result;

        const imagePath = await uploadImage(studentImages[i], `student_${i+1}_${Date.now()}.png`);
        const savedResult = await saveResult(testType, studentName, imagePath, JSON.stringify(parsedStudentAnswers), verificationResult);

        results.push({
          studentNumber: i + 1,
          testType,
          studentName,
          verificationResult,
          savedResult
        });
      }

      setResults(results);
      setTestProcessed(true);
      setStatus('All student tests processed successfully.');
    } catch (error) {
      // console.error('Error processing student tests:', error);
      setStatus(`Error: ${error.message}`);
      setTestProcessed(false);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="flex flex-col gap-4 py-2">
          <nav className="grid gap-1 px-2">
            <Link
              href="#"
              className="group flex items-center gap-2 rounded-lg px-3 py-2 font-semibold transition-all hover:bg-muted"
              prefetch={false}
            >
              Grader
            </Link>
            <Link
              href="#"
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <ClockIcon className="h-4 w-4" />
              Past Tests
            </Link>
            <Link
              href="#"
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Math Assignment Check</CardTitle>
              <CardDescription>Upload your answer key and test files to check your assignment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
              <div>
                <h3 className="text-lg font-semibold">Answer Key</h3>
                <p className="text-muted-foreground">Upload the answer key file for the assignment.</p>
                <div className="mt-4 flex items-center gap-2">
                  <Input id="answerKey" type="file" onChange={handleKeyUpload} />
                  <Button onClick={processKey} disabled={loading || keyImages.length === 0}>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  {keyProcessed ? (
                    <>
                      <CircleCheckIcon className="h-4 w-4 text-green-500" />
                      <span>Answer key uploaded successfully</span>
                    </>
                  ) : (
                    <>
                      <CircleXIcon className="h-4 w-4 text-red-500" />
                      <span>Answer key not uploaded yet</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Test</h3>
                <p className="text-muted-foreground">Upload the test file for the assignment.</p>
                <div className="mt-4 flex items-center gap-2">
                  <Input id="test" type="file" onChange={handleStudentUpload} />
                  <Button onClick={processStudentTests} disabled={loading || studentImages.length === 0 || !keyText}>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {testProcessed ? (
                    <>
                      <CircleCheckIcon className="h-4 w-4 text-green-500" />
                      <span>Test file uploaded successfully</span>
                    </>
                  ) : (
                    <>
                      <CircleXIcon className="h-4 w-4 text-red-500" />
                      <span>Test file not uploaded yet</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            {status && (
              <div className="mt-4 px-6 pb-6">
                <p className="text-sm text-gray-600">{status}</p>
                {loading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress * 100}%`}}></div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {keyProcessed && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Answer Key Questions</CardTitle>
                <CardDescription>Review and edit the extracted answer key questions.</CardDescription>
              </CardHeader>
              <CardContent>
                <KeyQuestions
                  parsedKeyQuestions={parsedKeyQuestions}
                  onEditQuestion={(questionIndex, updatedQuestion) => {
                    const updatedParsedKeyQuestions = [...parsedKeyQuestions];
                    updatedParsedKeyQuestions[questionIndex] = updatedQuestion;
                    setParsedKeyQuestions(updatedParsedKeyQuestions);
                    setKeyText(JSON.stringify(updatedParsedKeyQuestions));
                  }}
                />
              </CardContent>
            </Card>
          )}
          
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>View the results of the processed tests.</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CircleCheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function CircleXIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

function UploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}