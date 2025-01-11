import React, { useState } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';

interface FirestoreData {
  questionNo?: string;
  type: string;
  content: string;
}

export default function BulkRASearch() {
  const [numbers, setNumbers] = useState<string>('');
  const [debouncedNumbers, setDebouncedNumbers] = useState<string>('');
  let debounceTimer: NodeJS.Timeout;
  const [results, setResults] = useState<{
    existing: Question[];
    missing: string[];
  }>({ existing: [], missing: [] });
  const [newContent, setNewContent] = useState<string>('');
  const [selectedMissing, setSelectedMissing] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Split and clean input numbers
      const numberList = numbers
        .split(',')
        .map(n => n.trim())
        .filter(n => n);

      if (numberList.length === 0) {
        setError('Please enter valid numbers');
        setLoading(false);
        return;
      }

      // Get all RA questions
      const raQuery = query(
        collection(db, 'questions'),
        where('type', '==', 'RA')
      );
      
      const raSnapshot = await getDocs(raQuery);
      const existingQuestions: Question[] = [];
      const foundNumbers = new Set<string>();

      // Convert input numbers to database format (RA001)
      const searchNumbers = numberList.map(num => {
        const numericOnly = num.replace(/[^0-9]/g, '');
        return `RA${numericOnly.padStart(3, '0')}`;
      });

      // Process each document
      raSnapshot.docs.forEach(doc => {
        const data = doc.data() as FirestoreData;
        const storedQuestionNo = data.questionNo ?? '';
        
        if (searchNumbers.includes(storedQuestionNo)) {
          existingQuestions.push({
            id: doc.id,
            ...data
          } as Question);
          foundNumbers.add(storedQuestionNo);
        }
      });

      // Add unfound numbers to missing list
      const missingNumbers = searchNumbers
        .filter(searchNum => !foundNumbers.has(searchNum));

      setResults({
        existing: existingQuestions,
        missing: missingNumbers
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMissing = async () => {
    if (!selectedMissing || !newContent) return;

    setLoading(true);
    setError(null);

    try {
      const questionData = {
        type: 'RA',
        questionNo: selectedMissing,
        content: newContent,
      };

      await addDoc(collection(db, 'questions'), questionData);
      
      // Refresh the search results
      await handleSearch();
      
      // Clear the input fields
      setNewContent('');
      setSelectedMissing('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Numbers (comma-separated)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={numbers}
            onChange={(e) => {
              const value = e.target.value;
              setNumbers(value);
              
              if (debounceTimer) clearTimeout(debounceTimer);
              
              debounceTimer = setTimeout(() => {
                setDebouncedNumbers(value);
              }, 1000);
            }}
            placeholder="1, 2, 3"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !debouncedNumbers}
            className="inline-flex justify-center rounded-md border border-transparent bg-[#fc5d01] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {results.existing.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Existing RA Questions</h3>
            <button
              onClick={() => {
                const headers = ['QuestionNo', 'Content'];
                const csvContent = [
                  headers.join(','),
                  ...results.existing.map(q => [
                    (q as FirestoreData).questionNo,
                    `"${q.content.replace(/"/g, '""')}"` // Escape quotes in content
                  ].join(','))
                ].join('\n');

                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'ra_search_results.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-[#fc5d01] text-white px-4 py-2 rounded hover:bg-[#fd7f33] text-sm"
            >
              Export CSV
            </button>
          </div>
          <div className="space-y-3">
            {results.existing.map((question) => (
              <div key={question.id} className="p-3 bg-[#fedac2] rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-[#fc5d01]">{(question as FirestoreData).questionNo}</span>
                </div>
                <p className="text-gray-700">{question.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.missing.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Missing RA Questions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select RA Number to Add
              </label>
              <select
                value={selectedMissing}
                onChange={(e) => setSelectedMissing(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
              >
                <option value="">Select a number</option>
                {results.missing.map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {selectedMissing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content for {selectedMissing}
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
                  rows={4}
                />
                <button
                  onClick={handleAddMissing}
                  disabled={loading || !newContent}
                  className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-[#fc5d01] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
