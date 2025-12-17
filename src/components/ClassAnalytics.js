'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const ClassAnalytics = ({ results }) => {
  const analytics = useMemo(() => {
    if (!results || results.length === 0) return null;

    // Calculate scores for each student
    const studentScores = results.map(result => {
      if (!Array.isArray(result.verificationResult)) {
        return { score: 0, total: 0, percentage: 0 };
      }
      const correct = result.verificationResult.filter(q => q.correct).length;
      const total = result.verificationResult.length;
      return {
        studentNumber: result.studentNumber,
        studentName: result.studentName,
        score: correct,
        total,
        percentage: total > 0 ? (correct / total) * 100 : 0
      };
    });

    // Overall statistics
    const percentages = studentScores.map(s => s.percentage);
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const sorted = [...percentages].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const passRate = (percentages.filter(p => p >= 60).length / percentages.length) * 100;
    const perfectScores = percentages.filter(p => p === 100).length;

    // Standard deviation
    const squaredDiffs = percentages.map(p => Math.pow(p - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / percentages.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Score distribution buckets
    const distribution = {
      'A (90-100%)': percentages.filter(p => p >= 90).length,
      'B (80-89%)': percentages.filter(p => p >= 80 && p < 90).length,
      'C (70-79%)': percentages.filter(p => p >= 70 && p < 80).length,
      'D (60-69%)': percentages.filter(p => p >= 60 && p < 70).length,
      'F (0-59%)': percentages.filter(p => p < 60).length,
    };

    // Per-question analysis
    const questionStats = {};
    results.forEach(result => {
      if (!Array.isArray(result.verificationResult)) return;
      result.verificationResult.forEach(question => {
        const qNum = question.questionNumber;
        if (!questionStats[qNum]) {
          questionStats[qNum] = {
            questionNumber: qNum,
            text: question.text,
            correctCount: 0,
            totalCount: 0,
            incorrectAnswers: [],
            correctAnswer: question.correctAnswer
          };
        }
        questionStats[qNum].totalCount++;
        if (question.correct) {
          questionStats[qNum].correctCount++;
        } else {
          questionStats[qNum].incorrectAnswers.push({
            answer: question.studentAnswer,
            explanation: question.explanation
          });
        }
      });
    });

    // Calculate success rate for each question and find most missed
    const questionAnalysis = Object.values(questionStats).map(q => ({
      ...q,
      successRate: q.totalCount > 0 ? (q.correctCount / q.totalCount) * 100 : 0,
      missedCount: q.totalCount - q.correctCount
    })).sort((a, b) => a.successRate - b.successRate);

    // Find common wrong answers
    const commonMistakes = questionAnalysis
      .filter(q => q.missedCount > 0)
      .slice(0, 3)
      .map(q => {
        // Group incorrect answers
        const answerCounts = {};
        q.incorrectAnswers.forEach(ia => {
          const ans = ia.answer || 'No answer';
          answerCounts[ans] = (answerCounts[ans] || 0) + 1;
        });
        const sortedAnswers = Object.entries(answerCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);
        return {
          ...q,
          commonWrongAnswers: sortedAnswers
        };
      });

    return {
      studentScores,
      overall: {
        average,
        median,
        highest,
        lowest,
        passRate,
        perfectScores,
        stdDev,
        totalStudents: results.length
      },
      distribution,
      questionAnalysis,
      commonMistakes
    };
  }, [results]);

  if (!analytics) {
    return null;
  }

  const { overall, distribution, questionAnalysis, commonMistakes, studentScores } = analytics;

  return (
    <div className="space-y-6">
      {/* Overall Class Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Summary</CardTitle>
          <CardDescription>Overview of class performance on this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Class Average"
              value={`${overall.average.toFixed(1)}%`}
              color={overall.average >= 70 ? 'green' : overall.average >= 60 ? 'yellow' : 'red'}
            />
            <StatBox
              label="Median Score"
              value={`${overall.median.toFixed(1)}%`}
            />
            <StatBox
              label="Pass Rate"
              value={`${overall.passRate.toFixed(0)}%`}
              subtitle={`${Math.round(overall.passRate * overall.totalStudents / 100)}/${overall.totalStudents} students`}
              color={overall.passRate >= 70 ? 'green' : overall.passRate >= 50 ? 'yellow' : 'red'}
            />
            <StatBox
              label="Perfect Scores"
              value={overall.perfectScores}
              subtitle={`of ${overall.totalStudents} students`}
              color="blue"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <StatBox label="Highest Score" value={`${overall.highest.toFixed(0)}%`} color="green" />
            <StatBox label="Lowest Score" value={`${overall.lowest.toFixed(0)}%`} color="red" />
            <StatBox label="Std. Deviation" value={overall.stdDev.toFixed(1)} subtitle="score spread" />
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>Breakdown of grades across the class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(distribution).map(([grade, count]) => {
              const percentage = (count / overall.totalStudents) * 100;
              const colors = {
                'A (90-100%)': 'bg-green-500',
                'B (80-89%)': 'bg-blue-500',
                'C (70-79%)': 'bg-yellow-500',
                'D (60-69%)': 'bg-orange-500',
                'F (0-59%)': 'bg-red-500',
              };
              return (
                <div key={grade} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{grade}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${colors[grade]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-20 text-sm text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Analysis</CardTitle>
          <CardDescription>Success rate for each question (sorted by difficulty)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questionAnalysis.map((q) => (
              <div key={q.questionNumber} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Question {q.questionNumber}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    q.successRate >= 80 ? 'bg-green-100 text-green-800' :
                    q.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {q.successRate.toFixed(0)}% correct
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{q.text}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        q.successRate >= 80 ? 'bg-green-500' :
                        q.successRate >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${q.successRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {q.correctCount}/{q.totalCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      {commonMistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Areas Needing Review</CardTitle>
            <CardDescription>Most commonly missed questions and frequent wrong answers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commonMistakes.map((q) => (
                <div key={q.questionNumber} className="border-l-4 border-red-400 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Question {q.questionNumber}</span>
                    <span className="text-sm text-red-600">
                      ({q.missedCount} students missed)
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{q.text}</p>
                  <p className="text-sm">
                    <span className="font-medium text-green-700">Correct answer:</span> {q.correctAnswer}
                  </p>
                  {q.commonWrongAnswers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-600">Common wrong answers:</span>
                      <ul className="text-sm text-gray-600 mt-1">
                        {q.commonWrongAnswers.map(([answer, count], idx) => (
                          <li key={idx} className="ml-4">
                            "{answer}" - {count} student{count > 1 ? 's' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
          <CardDescription>Individual student scores ranked by performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2 px-2">Student</th>
                  <th className="text-center py-2 px-2">Score</th>
                  <th className="text-center py-2 px-2">Percentage</th>
                  <th className="text-center py-2 px-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {[...studentScores]
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((student, idx) => {
                    const grade = student.percentage >= 90 ? 'A' :
                                  student.percentage >= 80 ? 'B' :
                                  student.percentage >= 70 ? 'C' :
                                  student.percentage >= 60 ? 'D' : 'F';
                    const gradeColor = {
                      A: 'bg-green-100 text-green-800',
                      B: 'bg-blue-100 text-blue-800',
                      C: 'bg-yellow-100 text-yellow-800',
                      D: 'bg-orange-100 text-orange-800',
                      F: 'bg-red-100 text-red-800'
                    };
                    return (
                      <tr key={student.studentNumber} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2">{student.studentName}</td>
                        <td className="py-2 px-2 text-center">{student.score}/{student.total}</td>
                        <td className="py-2 px-2 text-center">{student.percentage.toFixed(0)}%</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${gradeColor[grade]}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for stat boxes
const StatBox = ({ label, value, subtitle, color }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    default: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.default}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default ClassAnalytics;
