// Topic tagging and mastery tracking utilities

// Predefined math topics with keywords for auto-detection
export const MATH_TOPICS = {
  'addition': {
    name: 'Addition',
    keywords: ['add', 'plus', 'sum', 'total', '+'],
    category: 'Arithmetic'
  },
  'subtraction': {
    name: 'Subtraction',
    keywords: ['subtract', 'minus', 'difference', 'take away', '-'],
    category: 'Arithmetic'
  },
  'multiplication': {
    name: 'Multiplication',
    keywords: ['multiply', 'times', 'product', '×', '*'],
    category: 'Arithmetic'
  },
  'division': {
    name: 'Division',
    keywords: ['divide', 'quotient', 'split', '÷', '/'],
    category: 'Arithmetic'
  },
  'fractions': {
    name: 'Fractions',
    keywords: ['fraction', 'numerator', 'denominator', 'half', 'third', 'quarter', '/'],
    category: 'Number Sense'
  },
  'decimals': {
    name: 'Decimals',
    keywords: ['decimal', 'point', '.'],
    category: 'Number Sense'
  },
  'percentages': {
    name: 'Percentages',
    keywords: ['percent', '%', 'percentage'],
    category: 'Number Sense'
  },
  'algebra': {
    name: 'Algebra',
    keywords: ['solve', 'equation', 'variable', 'x', 'y', '='],
    category: 'Algebra'
  },
  'linear-equations': {
    name: 'Linear Equations',
    keywords: ['linear', 'slope', 'intercept', 'y = mx + b'],
    category: 'Algebra'
  },
  'quadratic': {
    name: 'Quadratic Equations',
    keywords: ['quadratic', 'x²', 'parabola', 'factor'],
    category: 'Algebra'
  },
  'geometry': {
    name: 'Geometry',
    keywords: ['area', 'perimeter', 'volume', 'angle', 'triangle', 'circle', 'square', 'rectangle'],
    category: 'Geometry'
  },
  'trigonometry': {
    name: 'Trigonometry',
    keywords: ['sin', 'cos', 'tan', 'sine', 'cosine', 'tangent', 'angle'],
    category: 'Trigonometry'
  },
  'statistics': {
    name: 'Statistics',
    keywords: ['mean', 'median', 'mode', 'average', 'probability', 'data'],
    category: 'Statistics'
  },
  'word-problems': {
    name: 'Word Problems',
    keywords: ['how many', 'how much', 'find', 'calculate', 'determine'],
    category: 'Problem Solving'
  },
  'order-of-operations': {
    name: 'Order of Operations',
    keywords: ['pemdas', 'bodmas', 'order', 'parentheses', 'brackets'],
    category: 'Arithmetic'
  },
  'exponents': {
    name: 'Exponents',
    keywords: ['exponent', 'power', 'squared', 'cubed', '^', '²', '³'],
    category: 'Algebra'
  },
  'roots': {
    name: 'Roots & Radicals',
    keywords: ['square root', 'cube root', 'radical', '√'],
    category: 'Algebra'
  }
};

/**
 * Auto-detect topic from question text
 */
export const detectTopic = (questionText) => {
  const text = questionText.toLowerCase();
  const detectedTopics = [];

  for (const [topicId, topic] of Object.entries(MATH_TOPICS)) {
    const matchCount = topic.keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    ).length;

    if (matchCount > 0) {
      detectedTopics.push({ topicId, topic, matchCount });
    }
  }

  // Sort by match count and return most likely topic
  detectedTopics.sort((a, b) => b.matchCount - a.matchCount);
  return detectedTopics.length > 0 ? detectedTopics[0].topicId : 'general';
};

/**
 * Tag all questions with topics
 */
export const tagQuestionsWithTopics = (questions) => {
  return questions.map(q => ({
    ...q,
    topic: q.topic || detectTopic(q.text || ''),
    topicName: MATH_TOPICS[q.topic]?.name || MATH_TOPICS[detectTopic(q.text || '')]?.name || 'General'
  }));
};

/**
 * Calculate topic mastery from results
 */
export const calculateTopicMastery = (results) => {
  const topicStats = {};

  results.forEach(result => {
    if (!Array.isArray(result.verificationResult)) return;

    result.verificationResult.forEach(question => {
      const topic = question.topic || detectTopic(question.text || '');

      if (!topicStats[topic]) {
        topicStats[topic] = {
          topicId: topic,
          topicName: MATH_TOPICS[topic]?.name || 'General',
          category: MATH_TOPICS[topic]?.category || 'Other',
          correct: 0,
          total: 0,
          questions: []
        };
      }

      topicStats[topic].total++;
      if (question.correct) {
        topicStats[topic].correct++;
      }
      topicStats[topic].questions.push(question);
    });
  });

  // Calculate mastery percentage for each topic
  return Object.values(topicStats).map(topic => ({
    ...topic,
    masteryPercentage: topic.total > 0 ? (topic.correct / topic.total) * 100 : 0,
    needsReview: topic.total > 0 && (topic.correct / topic.total) < 0.7
  })).sort((a, b) => a.masteryPercentage - b.masteryPercentage);
};

/**
 * Calculate individual student topic mastery
 */
export const calculateStudentTopicMastery = (studentResults) => {
  const topicStats = {};

  studentResults.forEach(result => {
    if (!Array.isArray(result.verificationResult)) return;

    result.verificationResult.forEach(question => {
      const topic = question.topic || detectTopic(question.text || '');

      if (!topicStats[topic]) {
        topicStats[topic] = {
          topicId: topic,
          topicName: MATH_TOPICS[topic]?.name || 'General',
          correct: 0,
          total: 0
        };
      }

      topicStats[topic].total++;
      if (question.correct) {
        topicStats[topic].correct++;
      }
    });
  });

  return Object.values(topicStats).map(topic => ({
    ...topic,
    masteryPercentage: topic.total > 0 ? (topic.correct / topic.total) * 100 : 0
  }));
};

/**
 * Get recommended topics for review based on class performance
 */
export const getRecommendedReviewTopics = (topicMastery, threshold = 70) => {
  return topicMastery
    .filter(topic => topic.masteryPercentage < threshold)
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
    .slice(0, 5);
};

/**
 * Group topics by category
 */
export const groupTopicsByCategory = (topicMastery) => {
  const grouped = {};

  topicMastery.forEach(topic => {
    const category = topic.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(topic);
  });

  return grouped;
};
