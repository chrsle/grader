'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const AnswerKeyTemplates = ({ templates = [], onSelectTemplate, onSaveTemplate, onDeleteTemplate }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    subject: 'math',
    grade: '',
    questions: []
  });
  const [questionInput, setQuestionInput] = useState({ text: '', answer: '', topic: '', points: 1 });

  const handleAddQuestion = () => {
    if (!questionInput.text.trim() || !questionInput.answer.trim()) return;

    setNewTemplate({
      ...newTemplate,
      questions: [
        ...newTemplate.questions,
        {
          number: newTemplate.questions.length + 1,
          ...questionInput
        }
      ]
    });
    setQuestionInput({ text: '', answer: '', topic: '', points: 1 });
  };

  const handleRemoveQuestion = (index) => {
    const updated = newTemplate.questions.filter((_, i) => i !== index);
    setNewTemplate({
      ...newTemplate,
      questions: updated.map((q, i) => ({ ...q, number: i + 1 }))
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || newTemplate.questions.length === 0) return;

    onSaveTemplate?.({
      ...newTemplate,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });

    setNewTemplate({
      name: '',
      description: '',
      subject: 'math',
      grade: '',
      questions: []
    });
    setShowCreate(false);
  };

  const handleImportFromText = (text) => {
    // Parse text format: "1. Question text\nAnswer: answer"
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      const questionMatch = trimmed.match(/^(\d+)[.\)]\s*(.+)/);
      const answerMatch = trimmed.match(/^answer:?\s*(.+)/i);

      if (questionMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          number: parseInt(questionMatch[1]),
          text: questionMatch[2],
          answer: '',
          topic: '',
          points: 1
        };
      } else if (answerMatch && currentQuestion) {
        currentQuestion.answer = answerMatch[1];
      } else if (currentQuestion && trimmed) {
        currentQuestion.text += ' ' + trimmed;
      }
    });

    if (currentQuestion) questions.push(currentQuestion);

    setNewTemplate({ ...newTemplate, questions });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer Key Templates</CardTitle>
        <CardDescription>
          Save and reuse answer key templates for common test formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Template List */}
        {templates.length > 0 && !showCreate && (
          <div className="space-y-3 mb-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectTemplate?.(template)}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.questions?.length || 0} questions
                    {template.subject && ` • ${template.subject}`}
                    {template.grade && ` • Grade ${template.grade}`}
                  </div>
                  {template.description && (
                    <div className="text-sm text-gray-400 mt-1">{template.description}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectTemplate?.(template)}
                  >
                    Use
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onDeleteTemplate?.(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create New Template */}
        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} className="w-full">
            + Create New Template
          </Button>
        ) : (
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Create New Template</h4>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Chapter 5 Quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <select
                    className="w-full h-10 px-3 border rounded-md"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  >
                    <option value="math">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="history">History</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Grade Level</label>
                  <Input
                    value={newTemplate.grade}
                    onChange={(e) => setNewTemplate({ ...newTemplate, grade: e.target.value })}
                    placeholder="e.g., 5th"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe this template..."
                  rows={2}
                />
              </div>
            </div>

            {/* Import from text */}
            <div>
              <label className="text-sm font-medium">Quick Import</label>
              <Textarea
                placeholder="Paste questions in format:
1. What is 2+2?
Answer: 4
2. What is 5×3?
Answer: 15"
                rows={4}
                onChange={(e) => e.target.value && handleImportFromText(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Questions List */}
            {newTemplate.questions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Questions ({newTemplate.questions.length})</label>
                {newTemplate.questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="font-medium text-sm w-6">{q.number}.</span>
                    <div className="flex-1">
                      <div className="text-sm">{q.text}</div>
                      <div className="text-xs text-green-600">Answer: {q.answer}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Question Manually */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium">Add Question Manually</label>
              <div className="grid gap-2 mt-2">
                <Input
                  placeholder="Question text"
                  value={questionInput.text}
                  onChange={(e) => setQuestionInput({ ...questionInput, text: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Correct answer"
                    value={questionInput.answer}
                    onChange={(e) => setQuestionInput({ ...questionInput, answer: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Topic"
                    value={questionInput.topic}
                    onChange={(e) => setQuestionInput({ ...questionInput, topic: e.target.value })}
                    className="w-32"
                  />
                  <Input
                    type="number"
                    placeholder="Points"
                    value={questionInput.points}
                    onChange={(e) => setQuestionInput({ ...questionInput, points: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <Button onClick={handleAddQuestion} variant="outline">Add</Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={!newTemplate.name.trim() || newTemplate.questions.length === 0}
              >
                Save Template
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerKeyTemplates;
