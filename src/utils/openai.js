export const verifyAnswers = async (extractedText) => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedText }),
      });
  
      const data = await response.json();
      if (response.ok) {
        return data.result;
      } else {
        throw new Error(data.error || 'Failed to verify answers');
      }
    } catch (error) {
      console.error('Error in verifyAnswers:', error);
      throw error;
    }
  };
  