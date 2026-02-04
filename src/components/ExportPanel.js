'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  exportToCSV,
  exportDetailedCSV,
  exportAnalyticsSummary,
  openPDFReport,
  exportForGoogleSheets
} from '../utils/exportUtils';
import { generateStudentEmail, openEmailClient, generateBulkEmailContent } from '../utils/emailUtils';

const ExportPanel = ({ results, analytics, className = '' }) => {
  const [studentEmails, setStudentEmails] = useState({});
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleExport = (exportFn, ...args) => {
    try {
      exportFn(...args);
      setExportStatus('Export successful!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus(`Error: ${error.message}`);
    }
  };

  const handleEmailStudent = (result) => {
    const email = studentEmails[result.studentName] || '';
    const { subject, body } = generateStudentEmail(result, analytics);
    openEmailClient(email, subject, body);
  };

  const handleBulkEmail = () => {
    const emails = generateBulkEmailContent(results, studentEmails);
    // Create a text file with all email content for easy copy-paste
    const content = emails.map(e => `
To: ${e.email || '[EMAIL]'}
Subject: ${e.subject}

${e.body}

-----------------------------------
`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_emails.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Export & Share</CardTitle>
        <CardDescription>
          Download results in various formats or share with students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Export Options */}
          <div>
            <h4 className="font-medium mb-3">Download Reports</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(exportToCSV, results, 'grades.csv')}
              >
                <FileIcon className="h-4 w-4 mr-2" />
                CSV (Simple)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(exportDetailedCSV, results, 'detailed_grades.csv')}
              >
                <FileIcon className="h-4 w-4 mr-2" />
                CSV (Detailed)
              </Button>
              {analytics && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(exportAnalyticsSummary, analytics, 'class_analytics.csv')}
                >
                  <ChartIcon className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(exportForGoogleSheets, results, 'grades_for_sheets.tsv')}
              >
                <SheetIcon className="h-4 w-4 mr-2" />
                Google Sheets
              </Button>
            </div>
          </div>

          {/* PDF Report */}
          {analytics && (
            <div>
              <h4 className="font-medium mb-3">Print Report</h4>
              <Button
                variant="outline"
                onClick={() => openPDFReport(results, analytics, 'Math Class')}
              >
                <PrintIcon className="h-4 w-4 mr-2" />
                Open Printable Report
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Opens in new window. Use browser print (Ctrl/Cmd+P) to save as PDF.
              </p>
            </div>
          )}

          {/* Email Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Email Results to Students</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmailSetup(!showEmailSetup)}
              >
                {showEmailSetup ? 'Hide' : 'Setup Emails'}
              </Button>
            </div>

            {showEmailSetup && (
              <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">
                  Enter email addresses for each student:
                </p>
                {results.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-32 text-sm truncate">{result.studentName}</span>
                    <Input
                      type="email"
                      placeholder="student@email.com"
                      value={studentEmails[result.studentName] || ''}
                      onChange={(e) => setStudentEmails({
                        ...studentEmails,
                        [result.studentName]: e.target.value
                      })}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmailStudent(result)}
                      disabled={!studentEmails[result.studentName]}
                    >
                      Send
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEmail}
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Download All Emails
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Downloads a text file with pre-written emails for all students.
            </p>
          </div>

          {/* Status Message */}
          {exportStatus && (
            <div className={`text-sm p-2 rounded ${
              exportStatus.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {exportStatus}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Icon components
function FileIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChartIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SheetIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function PrintIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export default ExportPanel;
