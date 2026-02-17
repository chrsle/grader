import React, { useState, useEffect } from 'react';
import { getApiHeaders, API_FETCH_TIMEOUT_MS } from '../utils/constants';

const GradingCriteriaForm = ({ testType, onSave, questions = [] }) => {
  const [criteria, setCriteria] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCriteria = async () => {
      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

        const response = await fetch(
          `/api/grading-criteria?testType=${encodeURIComponent(testType)}`,
          { headers: getApiHeaders(), signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const savedCriteria = await response.json();
          if (savedCriteria && savedCriteria.length > 0) {
            setCriteria(savedCriteria);
          } else {
            // Initialize with default criteria if none are found
            setCriteria(questions.map((_, index) => ({ question: `Question ${index + 1}`, weight: 1 })));
          }
        } else {
          throw new Error('Failed to fetch grading criteria');
        }
      } catch (err) {
        setError('Failed to load grading criteria. Using default values.');
        setCriteria(questions.map((_, index) => ({ question: `Question ${index + 1}`, weight: 1 })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCriteria();
  }, [testType, questions]);

  const handleWeightChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index].weight = parseFloat(value) || 0;
    setCriteria(newCriteria);
  };

  const handleSave = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

      const response = await fetch('/api/grading-criteria', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ testType, criteria }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to save grading criteria');
      }

      onSave(criteria);
      setError(null);
    } catch (err) {
      setError('Failed to save grading criteria. Please try again.');
    }
  };

  if (isLoading) {
    return <p>Loading grading criteria...</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Grading Criteria</h3>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {criteria.map((criterion, index) => (
        <div key={index} className="flex mb-2 items-center">
          <span className="mr-2">{criterion.question}:</span>
          <input
            type="number"
            value={criterion.weight}
            onChange={(e) => handleWeightChange(index, e.target.value)}
            className="mr-2 p-1 border rounded w-20"
            placeholder="Weight"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        className="bg-green-500 text-white px-4 py-2 rounded mt-2"
      >
        Save Criteria
      </button>
    </div>
  );
};

export default GradingCriteriaForm;
