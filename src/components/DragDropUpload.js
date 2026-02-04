'use client';

import React, { useState, useCallback } from 'react';

const DragDropUpload = ({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  maxFiles = 50,
  maxSizeMB = 5,
  children,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const validateFiles = useCallback((files) => {
    const validFiles = [];
    const errors = [];

    const acceptedTypes = accept.split(',').map(t => t.trim());

    for (const file of files) {
      // Check file count
      if (validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/');
        if (type === '.csv') return file.name.endsWith('.csv') || file.type === 'text/csv';
        return file.type === type || file.name.endsWith(type);
      });

      if (!isValidType) {
        errors.push(`${file.name}: Invalid file type`);
        continue;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max ${maxSizeMB}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    return { validFiles, errors };
  }, [accept, maxFiles, maxSizeMB]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');

    const files = Array.from(e.dataTransfer.files);
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors[0]); // Show first error
    }

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  }, [validateFiles, onFilesSelected, multiple]);

  const handleFileInput = useCallback((e) => {
    setError('');
    const files = Array.from(e.target.files);
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors[0]);
    }

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  }, [validateFiles, onFilesSelected, multiple]);

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 rounded-lg z-10 flex items-center justify-center">
          <div className="text-blue-600 font-medium text-lg">
            Drop files here
          </div>
        </div>
      )}

      {/* File input wrapper */}
      <label className="cursor-pointer block">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
        {children || (
          <div className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}>
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span>
              {' '}or drag and drop
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {accept === 'image/*' ? 'PNG, JPG, GIF' : accept} up to {maxSizeMB}MB
              {multiple && ` (max ${maxFiles} files)`}
            </p>
          </div>
        )}
      </label>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

function UploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

export default DragDropUpload;
