'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const ComparativeAnalysis = ({ currentResults, previousResults = [], className = '' }) => {
  const comparison = useMemo(() => {
    if (!currentResults || currentResults.length === 0) return null;

    // Calculate current stats
    const currentScores = currentResults.map(r => {
      const vr = r.verificationResult || [];
      const correct = Array.isArray(vr) ? vr.filter(q => q.correct).length : 0;
      const total = Array.isArray(vr) ? vr.length : 1;
      return (correct / total) * 100;
    });

    const current = {
      average: currentScores.reduce((a, b) => a + b, 0) / currentScores.length,
      highest: Math.max(...currentScores),
      lowest: Math.min(...currentScores),
      passRate: (currentScores.filter(s => s >= 60).length / currentScores.length) * 100,
      count: currentScores.length
    };

    // Calculate previous stats if available
    let previous = null;
    if (previousResults && previousResults.length > 0) {
      const prevScores = previousResults.map(r => {
        const vr = r.verificationResult || [];
        const correct = Array.isArray(vr) ? vr.filter(q => q.correct).length : 0;
        const total = Array.isArray(vr) ? vr.length : 1;
        return (correct / total) * 100;
      });

      previous = {
        average: prevScores.reduce((a, b) => a + b, 0) / prevScores.length,
        highest: Math.max(...prevScores),
        lowest: Math.min(...prevScores),
        passRate: (prevScores.filter(s => s >= 60).length / prevScores.length) * 100,
        count: prevScores.length
      };
    }

    // Calculate improvements for each student (if names match)
    const studentImprovements = [];
    if (previous) {
      currentResults.forEach(cr => {
        const pr = previousResults.find(p => p.studentName === cr.studentName);
        if (pr) {
          const currentVr = cr.verificationResult || [];
          const prevVr = pr.verificationResult || [];
          const currentScore = Array.isArray(currentVr)
            ? (currentVr.filter(q => q.correct).length / currentVr.length) * 100
            : 0;
          const prevScore = Array.isArray(prevVr)
            ? (prevVr.filter(q => q.correct).length / prevVr.length) * 100
            : 0;

          studentImprovements.push({
            name: cr.studentName,
            current: currentScore,
            previous: prevScore,
            change: currentScore - prevScore
          });
        }
      });
    }

    return { current, previous, studentImprovements };
  }, [currentResults, previousResults]);

  if (!comparison) return null;

  const { current, previous, studentImprovements } = comparison;

  const renderChange = (currentVal, prevVal, suffix = '%', higherIsBetter = true) => {
    if (!prevVal) return null;
    const change = currentVal - prevVal;
    const isPositive = higherIsBetter ? change > 0 : change < 0;
    const color = isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    return (
      <span className={`text-sm ${color}`}>
        {arrow} {Math.abs(change).toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Comparative Analysis</CardTitle>
        <CardDescription>
          {previous
            ? 'Compare current results with previous assessment'
            : 'Current assessment statistics'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-center py-2">Current</th>
                  {previous && <th className="text-center py-2">Previous</th>}
                  {previous && <th className="text-center py-2">Change</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Class Average</td>
                  <td className="py-2 text-center">{current.average.toFixed(1)}%</td>
                  {previous && <td className="py-2 text-center">{previous.average.toFixed(1)}%</td>}
                  {previous && <td className="py-2 text-center">{renderChange(current.average, previous.average)}</td>}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Pass Rate</td>
                  <td className="py-2 text-center">{current.passRate.toFixed(0)}%</td>
                  {previous && <td className="py-2 text-center">{previous.passRate.toFixed(0)}%</td>}
                  {previous && <td className="py-2 text-center">{renderChange(current.passRate, previous.passRate)}</td>}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Highest Score</td>
                  <td className="py-2 text-center">{current.highest.toFixed(0)}%</td>
                  {previous && <td className="py-2 text-center">{previous.highest.toFixed(0)}%</td>}
                  {previous && <td className="py-2 text-center">{renderChange(current.highest, previous.highest)}</td>}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Lowest Score</td>
                  <td className="py-2 text-center">{current.lowest.toFixed(0)}%</td>
                  {previous && <td className="py-2 text-center">{previous.lowest.toFixed(0)}%</td>}
                  {previous && <td className="py-2 text-center">{renderChange(current.lowest, previous.lowest)}</td>}
                </tr>
                <tr>
                  <td className="py-2 font-medium">Students</td>
                  <td className="py-2 text-center">{current.count}</td>
                  {previous && <td className="py-2 text-center">{previous.count}</td>}
                  {previous && <td className="py-2 text-center">{renderChange(current.count, previous.count, '', true)}</td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Individual Student Changes */}
          {studentImprovements.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Individual Student Progress</h4>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {studentImprovements
                  .sort((a, b) => b.change - a.change)
                  .map((student, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded ${
                        student.change > 5 ? 'bg-green-50 dark:bg-green-900/20' :
                        student.change < -5 ? 'bg-red-50 dark:bg-red-900/20' :
                        'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <span className="font-medium">{student.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">{student.previous.toFixed(0)}%</span>
                        <span>→</span>
                        <span className="font-medium">{student.current.toFixed(0)}%</span>
                        <span className={`text-sm font-medium ${
                          student.change > 0 ? 'text-green-600' :
                          student.change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {student.change > 0 ? '+' : ''}{student.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Summary */}
              <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4 text-center">
                <div className="p-2 md:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg md:text-xl font-bold text-green-600">
                    {studentImprovements.filter(s => s.change > 5).length}
                  </div>
                  <div className="text-xs md:text-sm text-green-700">Improved</div>
                </div>
                <div className="p-2 md:p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg md:text-xl font-bold text-gray-600">
                    {studentImprovements.filter(s => Math.abs(s.change) <= 5).length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Stable</div>
                </div>
                <div className="p-2 md:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-lg md:text-xl font-bold text-red-600">
                    {studentImprovements.filter(s => s.change < -5).length}
                  </div>
                  <div className="text-xs md:text-sm text-red-700">Declined</div>
                </div>
              </div>
            </div>
          )}

          {!previous && (
            <div className="text-center py-4 text-gray-500">
              <p>No previous results available for comparison.</p>
              <p className="text-sm">Grade another assignment to see comparative analysis.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparativeAnalysis;
