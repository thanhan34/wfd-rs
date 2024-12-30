import React, { useState } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';

export default function BulkWFDInput() {
  const [numbers, setNumbers] = useState<string>('');
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
      const numberList = numbers
        .split(',')
        .map(n => n.trim())
        .filter(n => n && n.toUpperCase().startsWith('WFD')); // Only accept WFD numbers

      if (numberList.length === 0) {
        setError('Please enter valid WFD numbers');
        setLoading(false);
        return;
      }

      const existingQuestions: Question[] = [];
      const missingNumbers: string[] = [];

      for (const num of numberList) {
        const q = query(
          collection(db, 'questions'),
          where('WFDNo', '==', num)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          existingQuestions.push({
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          } as Question);
        } else {
          missingNumbers.push(num);
        }
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
      const questionData = {
        type: 'WFD',
        questionNo: selectedMissing,
        WFDNo: selectedMissing,
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
          Enter WFD Numbers (comma-separated)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={numbers}
            onChange={(e) => setNumbers(e.target.value)}
            placeholder="WFD001, WFD002, WFD003"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !numbers}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Existing WFD Questions</h3>
          <div className="space-y-3">
            {results.existing.map((question) => (
              <div key={question.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{question.questionNo}</span>
                  <span className="text-sm text-gray-500">WFD</span>
                </div>
                <p className="text-gray-700">{question.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.missing.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Missing WFD Questions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select WFD Number to Add
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
