import React, { useState, useCallback } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';

export default function BulkQuestionInput() {
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
        .map(n => n.trim().toUpperCase())
        .filter(n => n);

      if (numberList.length === 0) {
        setError('Please enter valid question numbers');
        setLoading(false);
        return;
      }

      const existingQuestions: Question[] = [];
      const missingNumbers: string[] = [];

      // Process numbers
      const wfdNumbers: string[] = [];
      const rsNumbers: string[] = [];
      
      for (const num of numberList) {
        if (num.startsWith('WFD')) {
          wfdNumbers.push(num);
        } else if (num.startsWith('RS')) {
          rsNumbers.push(num);
        } else {
          // If no prefix and is numeric, treat as WFD
          const numericOnly = num.replace(/[^0-9]/g, '');
          if (numericOnly) {
            wfdNumbers.push(`WFD${numericOnly}`);
          }
        }
      }

      // Search for WFD questions
      if (wfdNumbers.length > 0) {
        // Try first search with exact WFD numbers
        const wfdQuery = query(
          collection(db, 'questions'),
          where('type', '==', 'WFD')
        );
        const wfdSnapshot = await getDocs(wfdQuery);
        const foundWFDs = new Set();
        
        wfdSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const storedWFDNo = data.WFDNo || '';
          const searchWFDNo = storedWFDNo.startsWith('WFD') ? storedWFDNo : `WFD${storedWFDNo}`;
          
          // Check if this document matches any of our search numbers
          for (const searchNum of wfdNumbers) {
            const normalizedSearchNum = searchNum.startsWith('WFD') ? searchNum : `WFD${searchNum}`;
            if (searchWFDNo === normalizedSearchNum) {
              existingQuestions.push({
                id: doc.id,
                ...data
              } as Question);
              foundWFDs.add(normalizedSearchNum);
              break;
            }
          }
        });

        // Add unfound numbers to missing list
        wfdNumbers.forEach(num => {
          const normalizedNum = num.startsWith('WFD') ? num : `WFD${num}`;
          if (!foundWFDs.has(normalizedNum)) {
            missingNumbers.push(normalizedNum);
          }
        });
      }

      // Search for RS questions
      if (rsNumbers.length > 0) {
        const rsQuery = query(
          collection(db, 'questions'),
          where('RSNo', 'in', rsNumbers)
        );
        const rsSnapshot = await getDocs(rsQuery);
        const foundRSs = new Set(rsSnapshot.docs.map(doc => doc.data().RSNo));

        rsSnapshot.docs.forEach(doc => {
          existingQuestions.push({
            id: doc.id,
            ...doc.data()
          } as Question);
        });

        rsNumbers.forEach(num => {
          if (!foundRSs.has(num)) {
            missingNumbers.push(num);
          }
        });
      }

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
      const isWFD = selectedMissing.toUpperCase().startsWith('WFD') || !selectedMissing.toUpperCase().startsWith('RS');
      const type = isWFD ? 'WFD' : 'RS';
      
      const questionData = {
        type,
        questionNo: selectedMissing,
        content: newContent,
        ...(isWFD ? { WFDNo: selectedMissing } : { RSNo: selectedMissing })
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
          Enter Question Numbers (comma-separated)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={numbers}
            onChange={(e) => {
              const value = e.target.value;
              setNumbers(value);
              
              // Clear any existing timer
              if (debounceTimer) clearTimeout(debounceTimer);
              
              // Set a new timer
              debounceTimer = setTimeout(() => {
                setDebouncedNumbers(value);
              }, 1000); // 1 second delay
            }}
            placeholder="WFD001, RS001, WFD002"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !debouncedNumbers}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
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
            <h3 className="text-lg font-medium text-gray-900">Existing Questions</h3>
            <button
              onClick={() => {
                const headers = ['QuestionNo', 'Type', 'Content'];
                const csvContent = [
                  headers.join(','),
                  ...results.existing.map(q => [
                    q.type === 'WFD' ? (q as any).WFDNo : (q as any).RSNo,
                    q.type,
                    `"${q.content.replace(/"/g, '""')}"` // Escape quotes in content
                  ].join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'search_results.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
          </div>
          <div className="space-y-3">
            {results.existing.map((question) => (
              <div key={question.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {question.type === 'WFD' ? (question as any).WFDNo : (question as any).RSNo}
                  </span>
                  <span className="text-sm text-gray-500">{question.type}</span>
                </div>
                <p className="text-gray-700">{question.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.missing.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Missing Questions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Question Number to Add
              </label>
              <select
                value={selectedMissing}
                onChange={(e) => setSelectedMissing(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={4}
                />
                <button
                  onClick={handleAddMissing}
                  disabled={loading || !newContent}
                  className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
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
