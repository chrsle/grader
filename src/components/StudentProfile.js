'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { calculateStudentTopicMastery } from '../utils/topicUtils';

const StudentProfile = ({ student, testResults = [], onClose }) => {
  const analytics = useMemo(() => {
    if (!testResults || testResults.length === 0) {
      return null;
    }

    // Calculate overall statistics
    const scores = testResults.map(result => {
      const vr = result.verificationResult || [];
      const correct = Array.isArray(vr) ? vr.filter(q => q.correct).length : 0;
      const total = Array.isArray(vr) ? vr.length : 1;
      return {
        date: result.createdAt || result.date,
        percentage: (correct / total) * 100,
        correct,
        total,
        testType: result.testType
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const average = scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length;
    const highest = Math.max(...scores.map(s => s.percentage));
    const lowest = Math.min(...scores.map(s => s.percentage));
    const latest = scores[scores.length - 1];

    // Calculate trend
    let trend = 'stable';
    if (scores.length >= 2) {
      const recentAvg = scores.slice(-3).reduce((sum, s) => sum + s.percentage, 0) / Math.min(3, scores.length);
      const olderAvg = scores.slice(0, -3).reduce((sum, s) => sum + s.percentage, 0) / Math.max(1, scores.length - 3);
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';
    }

    // Topic mastery
    const topicMastery = calculateStudentTopicMastery(testResults);

    // Strengths and weaknesses
    const strengths = topicMastery.filter(t => t.masteryPercentage >= 80).slice(0, 3);
    const weaknesses = topicMastery.filter(t => t.masteryPercentage < 60).slice(0, 3);

    return {
      scores,
      average,
      highest,
      lowest,
      latest,
      trend,
      topicMastery,
      strengths,
      weaknesses,
      totalTests: testResults.length
    };
  }, [testResults]);

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No test results available for this student.
        </CardContent>
      </Card>
    );
  }

  const trendColors = {
    improving: 'text-green-600',
    declining: 'text-red-600',
    stable: 'text-gray-600'
  };

  const trendIcons = {
    improving: '↑',
    declining: '↓',
    stable: '→'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{student?.name || 'Student'}</CardTitle>
              <CardDescription>
                {student?.email && <span>{student.email} • </span>}
                {student?.studentId && <span>ID: {student.studentId} • </span>}
                {analytics.totalTests} tests completed
              </CardDescription>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              label="Current Grade"
              value={`${analytics.latest?.percentage.toFixed(0)}%`}
              grade={getLetterGrade(analytics.latest?.percentage)}
            />
            <StatBox
              label="Average"
              value={`${analytics.average.toFixed(1)}%`}
              grade={getLetterGrade(analytics.average)}
            />
            <StatBox
              label="Highest"
              value={`${analytics.highest.toFixed(0)}%`}
            />
            <StatBox
              label="Trend"
              value={
                <span className={trendColors[analytics.trend]}>
                  {trendIcons[analytics.trend]} {analytics.trend.charAt(0).toUpperCase() + analytics.trend.slice(1)}
                </span>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance History */}
      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.scores.map((score, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-500">
                  {score.date ? new Date(score.date).toLocaleDateString() : `Test ${idx + 1}`}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          score.percentage >= 80 ? 'bg-green-500' :
                          score.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score.percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-medium">
                      {score.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-500">
                  {score.correct}/{score.total}
                </div>
              </div>
            ))}
          </div>

          {/* Simple ASCII chart representation */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium mb-2">Progress Chart</div>
            <div className="flex items-end gap-1 h-24">
              {analytics.scores.map((score, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-t ${
                    score.percentage >= 80 ? 'bg-green-500' :
                    score.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${score.percentage}%` }}
                  title={`${score.percentage.toFixed(0)}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Oldest</span>
              <span>Most Recent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {analytics.strengths.length > 0 && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Strengths</CardTitle>
              <CardDescription>Topics with strong performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.strengths.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{topic.topicName}</span>
                    <span className="text-green-600 font-medium">
                      {topic.masteryPercentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.weaknesses.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Areas to Improve</CardTitle>
              <CardDescription>Topics needing more practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.weaknesses.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{topic.topicName}</span>
                    <span className="text-red-600 font-medium">
                      {topic.masteryPercentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Topic Mastery */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery</CardTitle>
          <CardDescription>Performance breakdown by mathematical concept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {analytics.topicMastery.map((topic, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{topic.topicName}</span>
                  <span className="text-sm text-gray-500">
                    {topic.correct}/{topic.total} ({topic.masteryPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      topic.masteryPercentage >= 80 ? 'bg-green-500' :
                      topic.masteryPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${topic.masteryPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper components
const StatBox = ({ label, value, grade }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
    {grade && (
      <div className={`text-lg font-semibold ${
        grade === 'A' ? 'text-green-600' :
        grade === 'B' ? 'text-blue-600' :
        grade === 'C' ? 'text-yellow-600' :
        grade === 'D' ? 'text-orange-600' : 'text-red-600'
      }`}>
        {grade}
      </div>
    )}
  </div>
);

const getLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

export default StudentProfile;
