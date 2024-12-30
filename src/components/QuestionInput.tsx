import React, { useState } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';

interface QuestionInputProps {
  onQuestionAdded: () => void;
}

export default function QuestionInput({ onQuestionAdded }: QuestionInputProps) {
  const [questionNos, setQuestionNos] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const numbers = questionNos.split(',').map(no => no.trim());
      
      for (const no of numbers) {
        const type = no.toUpperCase().startsWith('WFD') ? 'WFD' : 'RS';
        const questionNo = no.trim();

        // Check if question already exists
        const q = query(
          collection(db, 'questions'),
          where('questionNo', '==', questionNo)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Add new question
          const questionData: Omit<Question, 'id'> = {
            type,
            questionNo,
            content: newContent,
          };

          await addDoc(collection(db, 'questions'), questionData);
        }
      }

      setQuestionNos('');
      setNewContent('');
      onQuestionAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="questionNos" className="block text-sm font-medium text-gray-700">
          Question Numbers (comma-separated)
        </label>
        <input
          type="text"
          id="questionNos"
          value={questionNos}
          onChange={(e) => setQuestionNos(e.target.value)}
          placeholder="WFD001, RS001"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={4}
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Question'}
      </button>
    </form>
  );
}
