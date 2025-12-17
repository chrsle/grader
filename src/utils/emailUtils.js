// Email utilities for sending grade notifications

/**
 * Generate email content for a student
 */
export const generateStudentEmail = (result, analytics = null) => {
  const verificationResult = result.verificationResult || [];
  const isArray = Array.isArray(verificationResult);
  const correct = isArray ? verificationResult.filter(q => q.correct).length : 0;
  const total = isArray ? verificationResult.length : 0;
  const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
  const grade = getLetterGrade(percentage);

  const subject = `Your ${result.testType} Results`;

  const body = `
Dear ${result.studentName},

Your ${result.testType} has been graded. Here are your results:

Score: ${correct}/${total} (${percentage}%)
Grade: ${grade}

Question Breakdown:
${isArray ? verificationResult.map(q => `
  Question ${q.questionNumber}: ${q.correct ? '✓ Correct' : '✗ Incorrect'}
  Your Answer: ${q.studentAnswer}
  ${!q.correct ? `Correct Answer: ${q.correctAnswer}` : ''}
  ${q.explanation ? `Explanation: ${q.explanation}` : ''}
`).join('\n') : 'No detailed results available'}

${analytics ? `
Class Statistics:
- Class Average: ${analytics.overall.average.toFixed(1)}%
- Your Percentile: ${calculatePercentile(percentage, analytics.studentScores)}
` : ''}

If you have any questions, please reach out to your instructor.

Best regards,
Your Instructor
  `.trim();

  return { subject, body };
};

/**
 * Generate parent notification email
 */
export const generateParentEmail = (studentName, results, analytics = null) => {
  const latestResult = results[results.length - 1];
  const verificationResult = latestResult?.verificationResult || [];
  const isArray = Array.isArray(verificationResult);
  const correct = isArray ? verificationResult.filter(q => q.correct).length : 0;
  const total = isArray ? verificationResult.length : 0;
  const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
  const grade = getLetterGrade(percentage);

  const subject = `Grade Update for ${studentName}`;

  const body = `
Dear Parent/Guardian,

This is to inform you about ${studentName}'s recent academic performance.

Recent Assessment: ${latestResult?.testType || 'Math Test'}
Score: ${correct}/${total} (${percentage}%)
Grade: ${grade}

${analytics ? `
How ${studentName} compares to the class:
- Class Average: ${analytics.overall.average.toFixed(1)}%
- ${studentName}'s Score: ${percentage}%
` : ''}

${parseFloat(percentage) < 60 ? `
We noticed that ${studentName} may need additional support in this subject.
Please consider scheduling a meeting to discuss strategies for improvement.
` : parseFloat(percentage) >= 90 ? `
Congratulations! ${studentName} is performing excellently in this subject.
` : ''}

Please don't hesitate to reach out if you have any questions.

Best regards,
${studentName}'s Instructor
  `.trim();

  return { subject, body };
};

/**
 * Open email client with pre-filled content
 */
export const openEmailClient = (to, subject, body) => {
  const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
};

/**
 * Generate bulk email list (for copy-paste into email client)
 */
export const generateBulkEmailContent = (results, studentEmails = {}) => {
  const emails = results.map(result => {
    const email = studentEmails[result.studentName] || '';
    const { subject, body } = generateStudentEmail(result);
    return { email, studentName: result.studentName, subject, body };
  });

  return emails;
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

const calculatePercentile = (studentPercentage, studentScores) => {
  if (!studentScores || studentScores.length === 0) return 'N/A';
  const below = studentScores.filter(s => s.percentage < parseFloat(studentPercentage)).length;
  return Math.round((below / studentScores.length) * 100) + 'th';
};
