'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseQuestions } from '../utils/ocr';
import { uploadImage, saveResult, saveKeyText, getKeys, deleteKey } from '../utils/supabase';
import { validateImages } from '../utils/inputValidation';
import { processImagesInParallel } from '../utils/imageProcessing';
import { calculateTopicMastery, getRecommendedReviewTopics } from '../utils/topicUtils';

// Components
import KeyQuestions from '../components/KeyQuestions';
import ClassAnalytics from '../components/ClassAnalytics';
import TopicMastery from '../components/TopicMastery';
import StudentRoster from '../components/StudentRoster';
import DragDropUpload from '../components/DragDropUpload';
import AtRiskAlerts from '../components/AtRiskAlerts';
import ExportPanel from '../components/ExportPanel';
import AnswerKeyTemplates from '../components/AnswerKeyTemplates';
import CustomRubric from '../components/CustomRubric';
import PracticeGenerator from '../components/PracticeGenerator';
import ComparativeAnalysis from '../components/ComparativeAnalysis';
import { ThemeProvider, ThemeToggle } from '../components/ThemeProvider';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

export default function Home() {
  const isMobile = useIsMobile();
  const cameraInputRef = useRef(null);
  const studentCameraRef = useRef(null);

  // Core state
  const [keyImages, setKeyImages] = useState([]);
  const [studentImages, setStudentImages] = useState([]);
  const [keyText, setKeyText] = useState('');
  const [parsedKeyQuestions, setParsedKeyQuestions] = useState([]);
  const [savedKeys, setSavedKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keyProcessed, setKeyProcessed] = useState(false);
  const [testProcessed, setTestProcessed] = useState(false);

  // Mobile/UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Feature state
  const [activeTab, setActiveTab] = useState('grader');
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [rubric, setRubric] = useState(null);
  const [previousResults, setPreviousResults] = useState([]);

  // Analytics computations
  const analytics = useMemo(() => {
    if (!results || results.length === 0) return null;

    const studentScores = results.map(result => {
      const vr = result.verificationResult || [];
      const isArray = Array.isArray(vr);
      const correct = isArray ? vr.filter(q => q.correct).length : 0;
      const total = isArray ? vr.length : 0;
      return {
        studentNumber: result.studentNumber,
        studentName: result.studentName,
        score: correct,
        total,
        percentage: total > 0 ? (correct / total) * 100 : 0
      };
    });

    const percentages = studentScores.map(s => s.percentage);
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const sorted = [...percentages].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const distribution = {
      'A (90-100%)': percentages.filter(p => p >= 90).length,
      'B (80-89%)': percentages.filter(p => p >= 80 && p < 90).length,
      'C (70-79%)': percentages.filter(p => p >= 70 && p < 80).length,
      'D (60-69%)': percentages.filter(p => p >= 60 && p < 70).length,
      'F (0-59%)': percentages.filter(p => p < 60).length,
    };

    const questionStats = {};
    results.forEach(result => {
      if (!Array.isArray(result.verificationResult)) return;
      result.verificationResult.forEach(question => {
        const qNum = question.questionNumber;
        if (!questionStats[qNum]) {
          questionStats[qNum] = {
            questionNumber: qNum, text: question.text, correctCount: 0,
            totalCount: 0, incorrectAnswers: [], correctAnswer: question.correctAnswer
          };
        }
        questionStats[qNum].totalCount++;
        if (question.correct) questionStats[qNum].correctCount++;
        else questionStats[qNum].incorrectAnswers.push({ answer: question.studentAnswer });
      });
    });

    const questionAnalysis = Object.values(questionStats).map(q => ({
      ...q,
      successRate: q.totalCount > 0 ? (q.correctCount / q.totalCount) * 100 : 0,
      missedCount: q.totalCount - q.correctCount
    })).sort((a, b) => a.successRate - b.successRate);

    const commonMistakes = questionAnalysis.filter(q => q.missedCount > 0).slice(0, 3).map(q => ({
      ...q,
      commonWrongAnswers: Object.entries(
        q.incorrectAnswers.reduce((acc, ia) => {
          acc[ia.answer || 'No answer'] = (acc[ia.answer || 'No answer'] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 2)
    }));

    const squaredDiffs = percentages.map(p => Math.pow(p - average, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / percentages.length);

    return {
      studentScores,
      overall: { average, median, highest: Math.max(...percentages), lowest: Math.min(...percentages),
        passRate: (percentages.filter(p => p >= 60).length / percentages.length) * 100,
        perfectScores: percentages.filter(p => p === 100).length, stdDev, totalStudents: results.length },
      distribution, questionAnalysis, commonMistakes
    };
  }, [results]);

  const topicMastery = useMemo(() => calculateTopicMastery(results), [results]);
  const weakTopics = useMemo(() => getRecommendedReviewTopics(topicMastery), [topicMastery]);

  useEffect(() => {
    fetchSavedKeys();
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const s = localStorage.getItem('grader_students');
      const t = localStorage.getItem('grader_templates');
      const r = localStorage.getItem('grader_rubric');
      const p = localStorage.getItem('grader_prev_results');
      if (s) setStudents(JSON.parse(s));
      if (t) setTemplates(JSON.parse(t));
      if (r) setRubric(JSON.parse(r));
      if (p) setPreviousResults(JSON.parse(p));
    } catch (e) { console.error('Error loading localStorage:', e); }
  };

  const saveLocal = (key, value) => {
    try { localStorage.setItem(`grader_${key}`, JSON.stringify(value)); } catch (e) {}
  };

  const fetchSavedKeys = async () => {
    try {
      const keys = await getKeys();
      setSavedKeys(keys);
    } catch (error) {
      setStatus('Error fetching saved keys');
    }
  };

  const handleKeyFilesSelected = (files) => {
    try {
      validateImages(files);
      setKeyImages(files);
      setKeyProcessed(false);
      setSelectedKeyId(null);
    } catch (error) { setStatus(error.message); }
  };

  const handleStudentFilesSelected = (files) => {
    try {
      validateImages(files);
      setStudentImages(files);
      setTestProcessed(false);
    } catch (error) { setStatus(error.message); }
  };

  const handleSelectSavedKey = (key) => {
    try {
      const parsed = JSON.parse(key.extracted_text);
      setParsedKeyQuestions(parsed);
      setKeyText(key.extracted_text);
      setSelectedKeyId(key.id);
      setKeyProcessed(true);
      setKeyImages([]);
      setStatus('Key selected');
    } catch (error) { setStatus('Error loading key'); }
  };

  const handleSelectTemplate = (template) => {
    setParsedKeyQuestions(template.questions);
    setKeyText(JSON.stringify(template.questions));
    setKeyProcessed(true);
    setKeyImages([]);
    setStatus(`Template "${template.name}" loaded`);
  };

  const handleDeleteKey = async (keyId) => {
    try {
      await deleteKey(keyId);
      setSavedKeys(savedKeys.filter(k => k.id !== keyId));
      if (selectedKeyId === keyId) {
        setSelectedKeyId(null); setKeyText(''); setParsedKeyQuestions([]); setKeyProcessed(false);
      }
      setStatus('Key deleted');
    } catch (error) { setStatus('Error deleting key'); }
  };

  const processKey = async () => {
    setLoading(true); setStatus('Processing...'); setProgress(0);
    try {
      const texts = await processImagesInParallel(keyImages, (p) => {
        setProgress(p); setStatus(`Processing... ${Math.round(p * 100)}%`);
      });
      const parsedQuestions = parseQuestions(texts.join('\n'));
      const savedKey = await saveKeyText(JSON.stringify(parsedQuestions));
      setKeyText(JSON.stringify(parsedQuestions));
      setParsedKeyQuestions(parsedQuestions);
      setKeyProcessed(true);
      setSelectedKeyId(savedKey?.id || null);
      setStatus('Key saved!');
      fetchSavedKeys();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setKeyProcessed(false);
    } finally { setLoading(false); setProgress(0); }
  };

  const processStudentTests = async () => {
    if (!keyText) { setStatus('Select an answer key first'); return; }
    setLoading(true); setStatus('Grading...'); setProgress(0);

    if (results.length > 0) {
      setPreviousResults(results);
      saveLocal('prev_results', results);
    }

    try {
      const newResults = [];
      const texts = await processImagesInParallel(studentImages, (p) => {
        setProgress(p * 0.5);
        setStatus(`OCR... ${Math.round(p * 50)}%`);
      });

      for (let i = 0; i < texts.length; i++) {
        const studentText = texts[i];
        const rosterStudent = students[i];
        const studentName = rosterStudent?.name || `Student ${i + 1}`;

        setStatus(`Grading ${studentName}...`);
        setProgress(0.5 + (i / texts.length) * 0.4);

        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extractedText: studentText, keyText }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Verification failed');
        }

        const data = await response.json();
        const imagePath = await uploadImage(studentImages[i], `student_${i+1}_${Date.now()}.png`);
        const savedResult = await saveResult('Math Test', studentName, imagePath,
          JSON.stringify(parseQuestions(studentText)), data.result);

        newResults.push({
          studentNumber: i + 1, testType: 'Math Test', studentName,
          verificationResult: data.result, savedResult, email: rosterStudent?.email
        });
      }

      setResults(newResults);
      setTestProcessed(true);
      setStatus('Grading complete!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally { setLoading(false); setProgress(0); }
  };

  const handleStudentsChange = (s) => { setStudents(s); saveLocal('students', s); };
  const handleSaveTemplate = (t) => { const n = [...templates, t]; setTemplates(n); saveLocal('templates', n); };
  const handleDeleteTemplate = (id) => { const n = templates.filter(t => t.id !== id); setTemplates(n); saveLocal('templates', n); };
  const handleSaveRubric = (r) => { setRubric(r); saveLocal('rubric', r); setStatus('Rubric saved!'); };

  // Mobile camera capture handlers
  const handleCameraCapture = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (type === 'key') {
        handleKeyFilesSelected(files);
      } else {
        handleStudentFilesSelected(files);
      }
    }
  };

  // Quick action for teachers - grade last used key
  const quickGrade = () => {
    if (savedKeys.length > 0 && !keyProcessed) {
      handleSelectSavedKey(savedKeys[0]);
    }
    setActiveTab('grader');
  };

  const tabs = [
    { id: 'grader', label: 'Grader', icon: '📝' },
    { id: 'results', label: 'Results', icon: '📊', disabled: results.length === 0 },
    { id: 'analytics', label: 'Analytics', icon: '📈', disabled: results.length === 0 },
    { id: 'roster', label: 'Roster', icon: '👥' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'practice', label: 'Practice', icon: '✏️', disabled: results.length === 0 },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <ThemeProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md p-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
            </button>
            <h1 className="text-lg font-bold dark:text-white">Math Grader</h1>
            <ThemeToggle />
          </div>
        )}

        {/* Sidebar - Hidden on mobile unless open */}
        <div className={`
          ${isMobile ? 'fixed inset-0 z-40 transform transition-transform duration-300' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'w-full' : 'w-56'}
          bg-white dark:bg-gray-800 shadow-md flex flex-col
          ${isMobile ? 'pt-16' : ''}
        `}>
          {/* Overlay for mobile */}
          {isMobile && sidebarOpen && (
            <div
              className="absolute inset-0 bg-black/50 -z-10"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className={`${isMobile ? 'w-72 h-full bg-white dark:bg-gray-800' : 'w-full'} flex flex-col`}>
            {!isMobile && (
              <div className="p-4 border-b dark:border-gray-700">
                <h1 className="text-lg font-bold dark:text-white">Math Grader</h1>
                <p className="text-xs text-gray-500">AI-Powered</p>
              </div>
            )}

            {/* Teacher Quick Actions */}
            <div className="p-3 border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Quick Actions</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { quickGrade(); setSidebarOpen(false); }}
                  className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 min-h-[44px]"
                >
                  Quick Grade
                </button>
                {results.length > 0 && (
                  <button
                    onClick={() => { setActiveTab('results'); setSidebarOpen(false); }}
                    className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 min-h-[44px]"
                  >
                    View Results
                  </button>
                )}
              </div>
            </div>

            <nav className="flex-1 p-2 overflow-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { if (!tab.disabled) { setActiveTab(tab.id); setSidebarOpen(false); }}}
                  disabled={tab.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-base min-h-[48px] ${
                    activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                    tab.disabled ? 'text-gray-400 cursor-not-allowed' :
                    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'results' && results.length > 0 && (
                    <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {results.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {!isMobile && (
              <div className="p-3 border-t dark:border-gray-700">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            {/* Grader */}
            {activeTab === 'grader' && (
              <div className="space-y-4 md:space-y-6">
                <Card>
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="text-lg md:text-xl">Grade Assignments</CardTitle>
                    <CardDescription>Upload answer key and student tests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                    {/* Answer Key */}
                    <div>
                      <h3 className="font-semibold mb-2 text-base">1. Answer Key</h3>
                      {savedKeys.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {savedKeys.slice(0, 5).map(key => (
                            <button key={key.id} onClick={() => handleSelectSavedKey(key)}
                              className={`px-4 py-2 rounded-full text-sm border min-h-[44px] ${
                                selectedKeyId === key.id ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 hover:border-blue-500'
                              }`}>
                              Key #{key.id}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mobile Camera Capture */}
                      {isMobile && (
                        <div className="mb-3">
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleCameraCapture(e, 'key')}
                            multiple
                          />
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="w-full py-4 bg-blue-600 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 min-h-[56px] active:bg-blue-700"
                          >
                            <span className="text-xl">📷</span> Take Photo of Answer Key
                          </button>
                        </div>
                      )}

                      <DragDropUpload onFilesSelected={handleKeyFilesSelected} accept="image/*" multiple>
                        <div className={`border-2 border-dashed rounded-lg p-6 md:p-4 text-center min-h-[80px] flex items-center justify-center ${
                          keyImages.length > 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300'
                        }`}>
                          {keyImages.length > 0 ? (
                            <span className="text-green-700 dark:text-green-300 font-medium">{keyImages.length} file(s) selected</span>
                          ) : (
                            <span className="text-gray-500">{isMobile ? 'Tap to select files' : 'Drop answer key images or click'}</span>
                          )}
                        </div>
                      </DragDropUpload>
                      {keyImages.length > 0 && (
                        <Button onClick={processKey} disabled={loading} className="mt-3 w-full md:w-auto min-h-[48px]">
                          {loading ? 'Processing...' : 'Process Key'}
                        </Button>
                      )}
                      {keyProcessed && <p className="text-green-600 text-sm mt-2 font-medium">✓ Key ready</p>}
                    </div>

                    {/* Student Tests */}
                    <div>
                      <h3 className="font-semibold mb-2 text-base">2. Student Tests</h3>

                      {/* Mobile Camera Capture for Student Tests */}
                      {isMobile && (
                        <div className="mb-3">
                          <input
                            ref={studentCameraRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleCameraCapture(e, 'student')}
                            multiple
                          />
                          <button
                            onClick={() => studentCameraRef.current?.click()}
                            className="w-full py-4 bg-green-600 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 min-h-[56px] active:bg-green-700"
                          >
                            <span className="text-xl">📷</span> Take Photo of Student Test
                          </button>
                        </div>
                      )}

                      <DragDropUpload onFilesSelected={handleStudentFilesSelected} accept="image/*" multiple>
                        <div className={`border-2 border-dashed rounded-lg p-6 md:p-4 text-center min-h-[80px] flex items-center justify-center ${
                          studentImages.length > 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300'
                        }`}>
                          {studentImages.length > 0 ? (
                            <span className="text-green-700 dark:text-green-300 font-medium">{studentImages.length} file(s) selected</span>
                          ) : (
                            <span className="text-gray-500">{isMobile ? 'Tap to select files' : 'Drop student test images or click'}</span>
                          )}
                        </div>
                      </DragDropUpload>
                      <Button
                        onClick={processStudentTests}
                        disabled={loading || !keyProcessed || studentImages.length === 0}
                        className="mt-3 w-full md:w-auto min-h-[48px]"
                      >
                        {loading ? 'Grading...' : 'Grade Tests'}
                      </Button>
                    </div>

                    {/* Status */}
                    {status && (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium">{status}</p>
                        {loading && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {keyProcessed && parsedKeyQuestions.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Answer Key</CardTitle></CardHeader>
                    <CardContent>
                      <KeyQuestions parsedKeyQuestions={parsedKeyQuestions}
                        onEditQuestion={(i, u) => {
                          const n = [...parsedKeyQuestions]; n[i] = u;
                          setParsedKeyQuestions(n); setKeyText(JSON.stringify(n));
                        }} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Results */}
            {activeTab === 'results' && results.length > 0 && (
              <div className="space-y-6">
                <AtRiskAlerts results={results} />
                <Card>
                  <CardHeader>
                    <CardTitle>Results ({results.length} students)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.map((r, i) => {
                      const vr = r.verificationResult || [];
                      const correct = Array.isArray(vr) ? vr.filter(q => q.correct).length : 0;
                      const total = Array.isArray(vr) ? vr.length : 0;
                      const pct = total > 0 ? (correct / total) * 100 : 0;
                      return (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">{r.studentName}</h3>
                            <span className={`text-xl font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{correct}/{total} correct</p>
                          {Array.isArray(vr) && (
                            <div className="space-y-1">
                              {vr.map((q, qi) => (
                                <div key={qi} className={`p-2 rounded text-sm ${q.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                                  <span className="font-medium">Q{q.questionNumber}:</span> {q.correct ? '✓' : '✗'}
                                  <span className="text-gray-600 ml-2">{q.studentAnswer}</span>
                                  {!q.correct && <span className="text-green-600 ml-2">(Correct: {q.correctAnswer})</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <ExportPanel results={results} analytics={analytics} />
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && results.length > 0 && (
              <div className="space-y-6">
                <ClassAnalytics results={results} />
                <TopicMastery results={results} />
                <ComparativeAnalysis currentResults={results} previousResults={previousResults} />
              </div>
            )}

            {/* Roster */}
            {activeTab === 'roster' && (
              <StudentRoster students={students} onStudentsChange={handleStudentsChange} />
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <AnswerKeyTemplates templates={templates} onSelectTemplate={handleSelectTemplate}
                onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} />
            )}

            {/* Practice */}
            {activeTab === 'practice' && results.length > 0 && (
              <PracticeGenerator weakTopics={weakTopics} results={results} />
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <CustomRubric rubric={rubric} onRubricChange={setRubric} onSave={handleSaveRubric} />
                <Card>
                  <CardHeader><CardTitle>Data</CardTitle></CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (confirm('Clear all local data?')) {
                        localStorage.clear();
                        setStudents([]); setTemplates([]); setRubric(null); setPreviousResults([]);
                      }
                    }}>Clear Local Data</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
