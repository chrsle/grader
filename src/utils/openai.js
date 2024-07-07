export const verifyAnswers = async (studentAnswers, keyAnswers) => {
  try {
    const response = await fetch('/api/verify-answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentAnswers, keyAnswers }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify answers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying answers:', error);
    // Fallback to basic comparison if API call fails
    return studentAnswers.map(studentAnswer => {
      const keyAnswer = keyAnswers.find(ka => ka.number === studentAnswer.number);
      const isCorrect = studentAnswer.answer.trim().toLowerCase() === keyAnswer.answer.trim().toLowerCase();
      return {
        questionNumber: studentAnswer.number,
        correct: isCorrect,
        explanation: isCorrect ? 'Correct (basic comparison)' : 'Incorrect (basic comparison)',
        studentAnswer: studentAnswer.answer,
        correctAnswer: keyAnswer.answer
      };
    });
  }
};