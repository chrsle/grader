import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const KeyQuestions = ({ parsedKeyQuestions, onEditQuestion }) => {
  const [editingIndex, setEditingIndex] = useState(null);

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleSave = (index, updatedQuestion) => {
    onEditQuestion(index, updatedQuestion);
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Answer Key Questions</h2>
      <div className="grid gap-4">
        {parsedKeyQuestions.map((question, index) => (
          <div key={index} className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">{question.text}</h3>
            <p className="text-sm text-muted-foreground">Answer</p>
            {editingIndex === index ? (
              <>
                <Textarea
                  value={question.answer}
                  onChange={(e) => onEditQuestion(index, { ...question, answer: e.target.value })}
                  className="rounded-md border border-input bg-transparent p-2 text-sm"
                />
                <div className="w-full">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSave(index, question)}
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Textarea
                  value={question.answer}
                  readOnly
                  className="rounded-md border border-input bg-transparent p-2 text-sm"
                />
                <div className="w-full">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyQuestions;