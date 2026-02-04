'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const AtRiskAlerts = ({ results, studentHistory = [], threshold = 60 }) => {
  const alerts = useMemo(() => {
    if (!results || results.length === 0) return { atRisk: [], declining: [], improved: [] };

    const atRisk = [];
    const declining = [];
    const improved = [];

    results.forEach(result => {
      const verificationResult = result.verificationResult || [];
      const isArray = Array.isArray(verificationResult);
      const correct = isArray ? verificationResult.filter(q => q.correct).length : 0;
      const total = isArray ? verificationResult.length : 0;
      const percentage = total > 0 ? (correct / total) * 100 : 0;

      // Check if at risk (below threshold)
      if (percentage < threshold) {
        atRisk.push({
          ...result,
          percentage,
          severity: percentage < threshold - 20 ? 'high' : 'medium'
        });
      }

      // Check historical data for trends
      const history = studentHistory.filter(h => h.studentName === result.studentName);
      if (history.length >= 2) {
        const recentScores = history.slice(-3).map(h => {
          const vr = h.verificationResult || [];
          const c = Array.isArray(vr) ? vr.filter(q => q.correct).length : 0;
          const t = Array.isArray(vr) ? vr.length : 1;
          return (c / t) * 100;
        });

        // Check for declining trend
        if (recentScores.length >= 2) {
          const isDecline = recentScores.every((score, i) =>
            i === 0 || score < recentScores[i - 1]
          );
          const totalDrop = recentScores[0] - recentScores[recentScores.length - 1];

          if (isDecline && totalDrop > 10) {
            declining.push({
              ...result,
              previousScore: recentScores[0],
              currentScore: percentage,
              dropAmount: totalDrop
            });
          }

          // Check for improvement
          const isImproving = recentScores.every((score, i) =>
            i === 0 || score > recentScores[i - 1]
          );
          const totalGain = recentScores[recentScores.length - 1] - recentScores[0];

          if (isImproving && totalGain > 10) {
            improved.push({
              ...result,
              previousScore: recentScores[0],
              currentScore: percentage,
              gainAmount: totalGain
            });
          }
        }
      }
    });

    return {
      atRisk: atRisk.sort((a, b) => a.percentage - b.percentage),
      declining: declining.sort((a, b) => b.dropAmount - a.dropAmount),
      improved: improved.sort((a, b) => b.gainAmount - a.gainAmount)
    };
  }, [results, studentHistory, threshold]);

  const hasAlerts = alerts.atRisk.length > 0 || alerts.declining.length > 0;

  if (!hasAlerts && alerts.improved.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {alerts.atRisk.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertIcon className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800 dark:text-red-200">At-Risk Students</CardTitle>
            </div>
            <CardDescription className="text-red-600 dark:text-red-300">
              Students scoring below {threshold}% who may need additional support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.atRisk.map((student, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    student.severity === 'high'
                      ? 'bg-red-100 dark:bg-red-900/40 border border-red-300'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div>
                    <span className="font-medium">{student.studentName}</span>
                    {student.severity === 'high' && (
                      <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-700 dark:text-red-300">
                      {student.percentage.toFixed(0)}%
                    </span>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {(threshold - student.percentage).toFixed(0)}% below passing
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200">
              <h4 className="font-medium text-sm mb-2">Recommended Actions:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Schedule one-on-one meetings with at-risk students</li>
                <li>• Provide additional practice materials for weak topics</li>
                <li>• Consider peer tutoring or study groups</li>
                <li>• Contact parents/guardians for support at home</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Declining Performance */}
      {alerts.declining.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendDownIcon className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800 dark:text-orange-200">Declining Performance</CardTitle>
            </div>
            <CardDescription className="text-orange-600 dark:text-orange-300">
              Students showing a downward trend in recent assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.declining.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/40 rounded-lg"
                >
                  <span className="font-medium">{student.studentName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{student.previousScore.toFixed(0)}%</span>
                    <span className="text-orange-600">→</span>
                    <span className="font-bold text-orange-700">{student.currentScore.toFixed(0)}%</span>
                    <span className="text-xs text-red-600">
                      (↓{student.dropAmount.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improved Performance */}
      {alerts.improved.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendUpIcon className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800 dark:text-green-200">Improved Performance</CardTitle>
            </div>
            <CardDescription className="text-green-600 dark:text-green-300">
              Students showing improvement - consider recognition!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.improved.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/40 rounded-lg"
                >
                  <span className="font-medium">{student.studentName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{student.previousScore.toFixed(0)}%</span>
                    <span className="text-green-600">→</span>
                    <span className="font-bold text-green-700">{student.currentScore.toFixed(0)}%</span>
                    <span className="text-xs text-green-600">
                      (↑{student.gainAmount.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Icon components
function AlertIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function TrendDownIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function TrendUpIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export default AtRiskAlerts;
