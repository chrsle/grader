// Export utilities for CSV, PDF, and other formats

/**
 * Export results to CSV format
 */
export const exportToCSV = (results, filename = 'grades.csv') => {
  if (!results || results.length === 0) {
    throw new Error('No results to export');
  }

  const headers = [
    'Student Number',
    'Student Name',
    'Test Type',
    'Score',
    'Total Questions',
    'Percentage',
    'Grade',
    'Questions Correct',
    'Questions Incorrect'
  ];

  const rows = results.map(result => {
    const verificationResult = result.verificationResult || [];
    const isArray = Array.isArray(verificationResult);
    const correct = isArray ? verificationResult.filter(q => q.correct).length : 0;
    const total = isArray ? verificationResult.length : 0;
    const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
    const grade = getLetterGrade(percentage);

    const correctQuestions = isArray
      ? verificationResult.filter(q => q.correct).map(q => q.questionNumber).join('; ')
      : '';
    const incorrectQuestions = isArray
      ? verificationResult.filter(q => !q.correct).map(q => q.questionNumber).join('; ')
      : '';

    return [
      result.studentNumber,
      result.studentName,
      result.testType,
      correct,
      total,
      percentage + '%',
      grade,
      correctQuestions,
      incorrectQuestions
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Export detailed results with per-question breakdown
 */
export const exportDetailedCSV = (results, filename = 'detailed_grades.csv') => {
  if (!results || results.length === 0) {
    throw new Error('No results to export');
  }

  const headers = [
    'Student Number',
    'Student Name',
    'Question Number',
    'Question Text',
    'Student Answer',
    'Correct Answer',
    'Is Correct',
    'Explanation'
  ];

  const rows = [];
  results.forEach(result => {
    const verificationResult = result.verificationResult || [];
    if (Array.isArray(verificationResult)) {
      verificationResult.forEach(q => {
        rows.push([
          result.studentNumber,
          result.studentName,
          q.questionNumber,
          q.text,
          q.studentAnswer,
          q.correctAnswer,
          q.correct ? 'Yes' : 'No',
          q.explanation
        ]);
      });
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Export class analytics summary
 */
export const exportAnalyticsSummary = (analytics, filename = 'class_analytics.csv') => {
  const lines = [
    'Class Analytics Summary',
    '',
    'Overall Statistics',
    `Class Average,${analytics.overall.average.toFixed(1)}%`,
    `Median Score,${analytics.overall.median.toFixed(1)}%`,
    `Pass Rate,${analytics.overall.passRate.toFixed(1)}%`,
    `Highest Score,${analytics.overall.highest.toFixed(0)}%`,
    `Lowest Score,${analytics.overall.lowest.toFixed(0)}%`,
    `Standard Deviation,${analytics.overall.stdDev.toFixed(2)}`,
    `Total Students,${analytics.overall.totalStudents}`,
    `Perfect Scores,${analytics.overall.perfectScores}`,
    '',
    'Grade Distribution',
    ...Object.entries(analytics.distribution).map(([grade, count]) =>
      `${grade},${count},${((count / analytics.overall.totalStudents) * 100).toFixed(1)}%`
    ),
    '',
    'Question Analysis',
    'Question Number,Success Rate,Correct,Total',
    ...analytics.questionAnalysis.map(q =>
      `${q.questionNumber},${q.successRate.toFixed(1)}%,${q.correctCount},${q.totalCount}`
    )
  ];

  downloadFile(lines.join('\n'), filename, 'text/csv');
};

/**
 * Generate PDF report (returns HTML for printing)
 */
export const generatePDFReport = (results, analytics, className = 'Math Class') => {
  const date = new Date().toLocaleDateString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Grade Report - ${className}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .stat-box { display: inline-block; margin: 10px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-label { font-size: 12px; color: #666; }
        .grade-A { color: #22c55e; }
        .grade-B { color: #3b82f6; }
        .grade-C { color: #eab308; }
        .grade-D { color: #f97316; }
        .grade-F { color: #ef4444; }
        .page-break { page-break-before: always; }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Grade Report: ${className}</h1>
      <p>Generated on ${date}</p>

      <h2>Class Summary</h2>
      <div class="stat-box">
        <div class="stat-value">${analytics.overall.average.toFixed(1)}%</div>
        <div class="stat-label">Class Average</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${analytics.overall.passRate.toFixed(0)}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${analytics.overall.totalStudents}</div>
        <div class="stat-label">Total Students</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${analytics.overall.perfectScores}</div>
        <div class="stat-label">Perfect Scores</div>
      </div>

      <h2>Grade Distribution</h2>
      <table>
        <tr><th>Grade</th><th>Count</th><th>Percentage</th></tr>
        ${Object.entries(analytics.distribution).map(([grade, count]) => `
          <tr>
            <td>${grade}</td>
            <td>${count}</td>
            <td>${((count / analytics.overall.totalStudents) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>

      <h2>Student Results</h2>
      <table>
        <tr><th>Rank</th><th>Student</th><th>Score</th><th>Percentage</th><th>Grade</th></tr>
        ${[...analytics.studentScores]
          .sort((a, b) => b.percentage - a.percentage)
          .map((student, idx) => {
            const grade = getLetterGrade(student.percentage);
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${student.studentName}</td>
                <td>${student.score}/${student.total}</td>
                <td>${student.percentage.toFixed(0)}%</td>
                <td class="grade-${grade}">${grade}</td>
              </tr>
            `;
          }).join('')}
      </table>

      <div class="page-break"></div>

      <h2>Question Analysis</h2>
      <table>
        <tr><th>Question</th><th>Success Rate</th><th>Correct</th><th>Total</th></tr>
        ${analytics.questionAnalysis.map(q => `
          <tr>
            <td>Q${q.questionNumber}: ${q.text.substring(0, 50)}...</td>
            <td>${q.successRate.toFixed(0)}%</td>
            <td>${q.correctCount}</td>
            <td>${q.totalCount}</td>
          </tr>
        `).join('')}
      </table>

      <h2>Areas Needing Review</h2>
      ${analytics.commonMistakes.map(q => `
        <div style="margin: 10px 0; padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444;">
          <strong>Question ${q.questionNumber}</strong> (${q.missedCount} students missed)<br>
          ${q.text}<br>
          <span style="color: green;">Correct: ${q.correctAnswer}</span>
        </div>
      `).join('')}

      <div class="no-print" style="margin-top: 40px;">
        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Print Report</button>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Open PDF report in new window for printing
 */
export const openPDFReport = (results, analytics, className) => {
  const html = generatePDFReport(results, analytics, className);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export for Google Sheets (tab-separated values)
 */
export const exportForGoogleSheets = (results, filename = 'grades_for_sheets.tsv') => {
  if (!results || results.length === 0) {
    throw new Error('No results to export');
  }

  const headers = ['Student Name', 'Score', 'Percentage', 'Grade'];
  const rows = results.map(result => {
    const verificationResult = result.verificationResult || [];
    const isArray = Array.isArray(verificationResult);
    const correct = isArray ? verificationResult.filter(q => q.correct).length : 0;
    const total = isArray ? verificationResult.length : 0;
    const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
    return [result.studentName, `${correct}/${total}`, percentage + '%', getLetterGrade(percentage)];
  });

  const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  downloadFile(tsvContent, filename, 'text/tab-separated-values');
};

// Helper functions
const getLetterGrade = (percentage) => {
  const p = parseFloat(percentage);
  if (p >= 90) return 'A';
  if (p >= 80) return 'B';
  if (p >= 70) return 'C';
  if (p >= 60) return 'D';
  return 'F';
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
