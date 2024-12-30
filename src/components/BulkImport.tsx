import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TextToJsonConverter from './TextToJsonConverter';

interface BulkImportProps {
  onImportComplete: () => void;
}

export default function BulkImport({ onImportComplete }: BulkImportProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      // Parse JSON input
      const questions = JSON.parse(jsonInput);
      
      if (!Array.isArray(questions)) {
        throw new Error('Input must be an array of questions');
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (!q.questionNo || !q.content) {
          throw new Error(`Question at index ${index} is missing required fields`);
        }
        
        // Validate question number format (#number WFD/RS)
        if (!q.questionNo.match(/^#\d+\s*(WFD|RS)$/)) {
          throw new Error(`Question at index ${index} has invalid format. Expected format: #number WFD or #number RS`);
        }
        // Type is already set by TextToJsonConverter
      });

      // Add questions to Firebase with progress tracking
      const questionsRef = collection(db, 'questions');
      const total = questions.length;
      
      for (let i = 0; i < questions.length; i++) {
        await addDoc(questionsRef, questions[i]);
        const percentage = Math.round(((i + 1) / total) * 100);
        setProgress(percentage);
      }

      setSuccess(`Successfully imported ${questions.length} questions`);
      setJsonInput('');
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import questions');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">Bulk Import Questions</h3>
      
      <div className="mb-8">
        <TextToJsonConverter onJsonGenerated={setJsonInput} />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Or Import JSON Directly
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload JSON File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Paste JSON Data
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`[
  {
    "questionNo": "#418 WFD",
    "content": "University graduates lose their time finding jobs."
  },
  {
    "questionNo": "#123 RS",
    "content": "Question content here"
  }
]`}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
              focus:border-indigo-500 focus:ring-indigo-500 h-48"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-4">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm mt-4">
            {success}
          </div>
        )}

        {loading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Importing questions...</span>
              <span className="text-sm font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={loading || !jsonInput.trim()}
          className="mt-4 inline-flex justify-center rounded-md border border-transparent 
            bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm 
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
            focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? `Importing... ${progress}%` : 'Import Questions'}
        </button>
      </div>
    </div>
  );
}
