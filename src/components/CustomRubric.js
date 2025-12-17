'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CustomRubric = ({ rubric, onRubricChange, onSave }) => {
  const [localRubric, setLocalRubric] = useState(rubric || {
    name: '',
    passingScore: 60,
    allowPartialCredit: true,
    partialCreditPercentage: 50,
    categories: [],
    questionWeights: {}
  });

  const [newCategory, setNewCategory] = useState({ name: '', weight: 100, description: '' });

  const handleChange = (field, value) => {
    const updated = { ...localRubric, [field]: value };
    setLocalRubric(updated);
    onRubricChange?.(updated);
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) return;

    const category = {
      id: Date.now(),
      ...newCategory,
      weight: parseInt(newCategory.weight) || 100
    };

    handleChange('categories', [...localRubric.categories, category]);
    setNewCategory({ name: '', weight: 100, description: '' });
  };

  const removeCategory = (id) => {
    handleChange('categories', localRubric.categories.filter(c => c.id !== id));
  };

  const updateCategory = (id, updates) => {
    handleChange('categories', localRubric.categories.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const setQuestionWeight = (questionNumber, weight) => {
    handleChange('questionWeights', {
      ...localRubric.questionWeights,
      [questionNumber]: parseInt(weight) || 1
    });
  };

  const totalWeight = localRubric.categories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Grading Rubric</CardTitle>
        <CardDescription>
          Define how assignments should be graded with custom weights and partial credit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Rubric Name</label>
            <Input
              value={localRubric.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Chapter 5 Test Rubric"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Passing Score (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={localRubric.passingScore}
                onChange={(e) => handleChange('passingScore', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grade Scale</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={localRubric.gradeScale || 'standard'}
                onChange={(e) => handleChange('gradeScale', e.target.value)}
              >
                <option value="standard">Standard (A-F)</option>
                <option value="plusminus">Plus/Minus (A+, A, A-...)</option>
                <option value="passfail">Pass/Fail</option>
                <option value="percentage">Percentage Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partial Credit */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">Partial Credit</h4>
              <p className="text-sm text-gray-500">Award points for partially correct answers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localRubric.allowPartialCredit}
                onChange={(e) => handleChange('allowPartialCredit', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {localRubric.allowPartialCredit && (
            <div>
              <label className="text-sm font-medium">Partial Credit Percentage</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={localRubric.partialCreditPercentage}
                  onChange={(e) => handleChange('partialCreditPercentage', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">% of full credit for partially correct answers</span>
              </div>
            </div>
          )}
        </div>

        {/* Grading Categories */}
        <div>
          <h4 className="font-medium mb-3">Grading Categories</h4>
          <p className="text-sm text-gray-500 mb-3">
            Define categories to group questions (e.g., &quot;Computation&quot;, &quot;Word Problems&quot;)
          </p>

          {/* Existing Categories */}
          {localRubric.categories.length > 0 && (
            <div className="space-y-2 mb-4">
              {localRubric.categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Input
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                      className="mb-1"
                    />
                    <Input
                      value={category.description}
                      onChange={(e) => updateCategory(category.id, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500">Weight</label>
                    <Input
                      type="number"
                      min="1"
                      value={category.weight}
                      onChange={(e) => updateCategory(category.id, { weight: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                Total weight: {totalWeight}% {totalWeight !== 100 && '(should equal 100%)'}
              </div>
            </div>
          )}

          {/* Add Category */}
          <div className="flex gap-2">
            <Input
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Weight"
              value={newCategory.weight}
              onChange={(e) => setNewCategory({ ...newCategory, weight: e.target.value })}
              className="w-24"
            />
            <Button onClick={addCategory} variant="outline">Add</Button>
          </div>
        </div>

        {/* Question Weights */}
        <div>
          <h4 className="font-medium mb-3">Question Weights</h4>
          <p className="text-sm text-gray-500 mb-3">
            Assign different point values to questions (default: 1 point each)
          </p>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qNum) => (
              <div key={qNum} className="flex flex-col">
                <label className="text-xs text-gray-500 text-center">Q{qNum}</label>
                <Input
                  type="number"
                  min="1"
                  value={localRubric.questionWeights[qNum] || 1}
                  onChange={(e) => setQuestionWeight(qNum, e.target.value)}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLocalRubric({
            name: '',
            passingScore: 60,
            allowPartialCredit: true,
            partialCreditPercentage: 50,
            categories: [],
            questionWeights: {}
          })}>
            Reset
          </Button>
          <Button onClick={() => onSave?.(localRubric)}>
            Save Rubric
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomRubric;
