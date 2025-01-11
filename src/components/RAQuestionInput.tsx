import React, { useState } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';

interface RAQuestionInputProps {
  onQuestionAdded: () => void;
}

export default function RAQuestionInput({ onQuestionAdded }: RAQuestionInputProps) {
  const [questionNo, setQuestionNo] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if question already exists
      const q = query(
        collection(db, 'questions'),
        where('questionNo', '==', questionNo)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Add new question
        const questionData: Omit<Question, 'id'> = {
          type: 'RA',
          questionNo: questionNo.trim(),
          content: newContent,
        };

        await addDoc(collection(db, 'questions'), questionData);
        setQuestionNo('');
        setNewContent('');
        onQuestionAdded();
      } else {
        setError('Question number already exists');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="questionNo" className="block text-sm font-medium text-gray-700">
          Question Number
        </label>
        <input
          type="text"
          id="questionNo"
          value={questionNo}
          onChange={(e) => setQuestionNo(e.target.value)}
          placeholder="RA001"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
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
        className="inline-flex justify-center rounded-md border border-transparent bg-[#fc5d01] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add RA Question'}
      </button>
    </form>
  );
}
