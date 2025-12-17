'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PracticeGenerator = ({ weakTopics = [], results = [] }) => {
  const [generatedProblems, setGeneratedProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);

  const generateProblems = async () => {
    setLoading(true);
    try {
      // Get missed questions for context
      const missedQuestions = [];
      results.forEach(result => {
        if (Array.isArray(result.verificationResult)) {
          result.verificationResult
            .filter(q => !q.correct)
            .forEach(q => missedQuestions.push(q));
        }
      });

      const response = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty,
          count,
          missedQuestions: missedQuestions.slice(0, 5) // Send sample of missed questions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedProblems(data.problems || []);
      } else {
        // Fallback: Generate sample problems client-side
        setGeneratedProblems(generateSampleProblems(selectedTopic, difficulty, count));
      }
    } catch (error) {
      console.error('Error generating problems:', error);
      // Fallback to sample problems
      setGeneratedProblems(generateSampleProblems(selectedTopic, difficulty, count));
    } finally {
      setLoading(false);
    }
  };

  const generateSampleProblems = (topic, difficulty, count) => {
    // Client-side problem generation for common topics
    const templates = {
      'addition': [
        { q: 'What is {a} + {b}?', gen: () => ({ a: rand(10, 100), b: rand(10, 100) }), ans: (v) => v.a + v.b },
        { q: 'Find the sum: {a} + {b} + {c}', gen: () => ({ a: rand(5, 50), b: rand(5, 50), c: rand(5, 50) }), ans: (v) => v.a + v.b + v.c },
      ],
      'subtraction': [
        { q: 'What is {a} - {b}?', gen: () => ({ a: rand(50, 200), b: rand(10, 49) }), ans: (v) => v.a - v.b },
        { q: 'Calculate: {a} - {b} - {c}', gen: () => ({ a: rand(100, 200), b: rand(10, 40), c: rand(10, 40) }), ans: (v) => v.a - v.b - v.c },
      ],
      'multiplication': [
        { q: 'What is {a} × {b}?', gen: () => ({ a: rand(2, 12), b: rand(2, 12) }), ans: (v) => v.a * v.b },
        { q: 'Calculate {a} × {b} × {c}', gen: () => ({ a: rand(2, 5), b: rand(2, 5), c: rand(2, 5) }), ans: (v) => v.a * v.b * v.c },
      ],
      'division': [
        { q: 'What is {product} ÷ {b}?', gen: () => { const b = rand(2, 12); return { product: b * rand(2, 12), b }; }, ans: (v) => v.product / v.b },
      ],
      'fractions': [
        { q: 'Simplify: {num}/{denom}', gen: () => { const f = rand(2, 6); return { num: f * rand(1, 4), denom: f * rand(2, 5) }; }, ans: (v) => `${v.num / gcd(v.num, v.denom)}/${v.denom / gcd(v.num, v.denom)}` },
        { q: 'What is 1/{a} + 1/{b}?', gen: () => ({ a: rand(2, 6), b: rand(2, 6) }), ans: (v) => `${v.a + v.b}/${v.a * v.b}` },
      ],
      'percentages': [
        { q: 'What is {percent}% of {num}?', gen: () => ({ percent: rand(1, 10) * 10, num: rand(5, 20) * 10 }), ans: (v) => (v.percent / 100) * v.num },
      ],
      'algebra': [
        { q: 'Solve for x: x + {a} = {sum}', gen: () => { const a = rand(5, 20); const x = rand(1, 20); return { a, sum: x + a, x }; }, ans: (v) => v.x },
        { q: 'Solve for x: {a}x = {product}', gen: () => { const a = rand(2, 10); const x = rand(2, 10); return { a, product: a * x, x }; }, ans: (v) => v.x },
      ],
      'geometry': [
        { q: 'What is the area of a rectangle with length {l} and width {w}?', gen: () => ({ l: rand(5, 15), w: rand(3, 10) }), ans: (v) => v.l * v.w },
        { q: 'What is the perimeter of a square with side {s}?', gen: () => ({ s: rand(5, 20) }), ans: (v) => 4 * v.s },
      ],
      'default': [
        { q: 'What is {a} + {b}?', gen: () => ({ a: rand(10, 100), b: rand(10, 100) }), ans: (v) => v.a + v.b },
        { q: 'What is {a} × {b}?', gen: () => ({ a: rand(2, 12), b: rand(2, 12) }), ans: (v) => v.a * v.b },
      ]
    };

    const difficultyMultiplier = difficulty === 'easy' ? 0.5 : difficulty === 'hard' ? 2 : 1;
    const topicTemplates = templates[topic] || templates['default'];

    return Array.from({ length: count }, (_, i) => {
      const template = topicTemplates[i % topicTemplates.length];
      const values = template.gen();

      // Apply difficulty multiplier to values
      Object.keys(values).forEach(key => {
        if (typeof values[key] === 'number' && key !== 'x') {
          values[key] = Math.round(values[key] * difficultyMultiplier) || 1;
        }
      });

      let question = template.q;
      Object.entries(values).forEach(([key, value]) => {
        question = question.replace(`{${key}}`, value);
      });

      return {
        number: i + 1,
        question,
        answer: String(template.ans(values)),
        topic,
        difficulty,
        showAnswer: false
      };
    });
  };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

  const toggleAnswer = (index) => {
    setGeneratedProblems(problems =>
      problems.map((p, i) => i === index ? { ...p, showAnswer: !p.showAnswer } : p)
    );
  };

  const exportProblems = (includeAnswers = false) => {
    let content = `Practice Problems - ${selectedTopic || 'Mixed'}\n`;
    content += `Difficulty: ${difficulty}\n\n`;

    generatedProblems.forEach((p, i) => {
      content += `${i + 1}. ${p.question}\n`;
      if (includeAnswers) {
        content += `   Answer: ${p.answer}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practice_problems_${includeAnswers ? 'with_answers' : 'worksheet'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Problem Generator</CardTitle>
        <CardDescription>
          Generate practice problems based on topics students struggle with
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Topic Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Topic</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="">Select topic...</option>
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
                <option value="fractions">Fractions</option>
                <option value="percentages">Percentages</option>
                <option value="algebra">Algebra</option>
                <option value="geometry">Geometry</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Number of Problems</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              >
                <option value="5">5 problems</option>
                <option value="10">10 problems</option>
                <option value="15">15 problems</option>
                <option value="20">20 problems</option>
              </select>
            </div>
          </div>

          {/* Suggested Topics (from weak areas) */}
          {weakTopics.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Suggested topics (based on class performance):
              </p>
              <div className="flex flex-wrap gap-2">
                {weakTopics.slice(0, 5).map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTopic(topic.topicId)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTopic === topic.topicId
                        ? 'bg-yellow-500 text-white'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {topic.topicName} ({topic.masteryPercentage.toFixed(0)}%)
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={generateProblems}
            disabled={loading || !selectedTopic}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Practice Problems'}
          </Button>

          {/* Generated Problems */}
          {generatedProblems.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Generated Problems</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => exportProblems(false)}>
                    Export Worksheet
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportProblems(true)}>
                    Export with Answers
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {generatedProblems.map((problem, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium">{problem.number}.</span>{' '}
                        <span>{problem.question}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAnswer(idx)}
                      >
                        {problem.showAnswer ? 'Hide' : 'Show'} Answer
                      </Button>
                    </div>
                    {problem.showAnswer && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          Answer: {problem.answer}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeGenerator;
