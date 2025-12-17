'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const StudentRoster = ({ students, onStudentsChange, onImport }) => {
  const [newStudent, setNewStudent] = useState({ name: '', email: '', studentId: '' });
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleAddStudent = () => {
    if (!newStudent.name.trim()) return;

    const student = {
      id: Date.now(),
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      studentId: newStudent.studentId.trim(),
      createdAt: new Date().toISOString()
    };

    onStudentsChange([...students, student]);
    setNewStudent({ name: '', email: '', studentId: '' });
  };

  const handleRemoveStudent = (id) => {
    onStudentsChange(students.filter(s => s.id !== id));
  };

  const handleEditStudent = (id, updates) => {
    onStudentsChange(students.map(s => s.id === id ? { ...s, ...updates } : s));
    setEditingId(null);
  };

  const handleBulkImport = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const newStudents = lines.map((line, index) => {
      // Support formats: "Name", "Name, Email", "Name, Email, ID", or tab-separated
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      return {
        id: Date.now() + index,
        name: parts[0]?.trim() || `Student ${students.length + index + 1}`,
        email: parts[1]?.trim() || '',
        studentId: parts[2]?.trim() || '',
        createdAt: new Date().toISOString()
      };
    });

    onStudentsChange([...students, ...newStudents]);
    setBulkInput('');
    setShowBulkImport(false);
  };

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());

      // Skip header row if it looks like headers
      const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

      const newStudents = lines.slice(startIndex).map((line, index) => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        return {
          id: Date.now() + index,
          name: parts[0] || `Student ${students.length + index + 1}`,
          email: parts[1] || '',
          studentId: parts[2] || '',
          createdAt: new Date().toISOString()
        };
      });

      onStudentsChange([...students, ...newStudents]);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const exportRoster = () => {
    const csv = [
      'Name,Email,Student ID',
      ...students.map(s => `"${s.name}","${s.email}","${s.studentId}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_roster.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Roster</CardTitle>
        <CardDescription>
          Manage your class roster. Students will be auto-matched during grading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Add */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Student name"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Email (optional)"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="ID (optional)"
            value={newStudent.studentId}
            onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
            className="w-32"
          />
          <Button onClick={handleAddStudent}>Add</Button>
        </div>

        {/* Import Options */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowBulkImport(!showBulkImport)}>
            Bulk Import
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>Import CSV</span>
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>
          {students.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportRoster}>
              Export CSV
            </Button>
          )}
        </div>

        {/* Bulk Import Area */}
        {showBulkImport && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Paste student list (one per line). Format: Name, Email, ID (comma or tab separated)
            </p>
            <Textarea
              placeholder="John Doe, john@email.com, 12345
Jane Smith, jane@email.com, 12346
..."
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={5}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkImport}>Import</Button>
              <Button size="sm" variant="outline" onClick={() => setShowBulkImport(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Student List */}
        {students.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500">{index + 1}</td>
                    <td className="py-2 px-3">
                      {editingId === student.id ? (
                        <Input
                          defaultValue={student.name}
                          onBlur={(e) => handleEditStudent(student.id, { name: e.target.value })}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => setEditingId(student.id)}
                        >
                          {student.name}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{student.email || '-'}</td>
                    <td className="py-2 px-3 text-gray-600">{student.studentId || '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No students added yet.</p>
            <p className="text-sm">Add students individually or import from CSV.</p>
          </div>
        )}

        {students.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {students.length} student{students.length !== 1 ? 's' : ''} in roster
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentRoster;
