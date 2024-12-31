import React, { useEffect, useState, useCallback, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, deleteQuestion, updateQuestion } from '../lib/firebase';
import { Question } from '../types';

interface QuestionListProps {
  filter?: 'WFD' | 'RS';
  onRefresh?: () => void;
}

export default function QuestionList({ filter, onRefresh }: QuestionListProps): React.ReactElement {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editQuestionNo, setEditQuestionNo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchDebounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'questions'));
      const fetchedQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];

      // Filter questions if filter is provided
      let filteredQuestions = filter
        ? fetchedQuestions.filter(q => q.type === filter)
        : fetchedQuestions;

      // Apply search filter if search term exists
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q => 
          q.content.toLowerCase().includes(term) || 
          q.questionNo.toLowerCase().includes(term)
        );
      }

      // Sort questions by questionNo
      const sortedQuestions = filteredQuestions.sort((a, b) => {
        // Convert questionNo strings to numbers for proper numerical sorting
        const aNum = parseInt(a.questionNo.replace(/\D/g, ''));
        const bNum = parseInt(b.questionNo.replace(/\D/g, ''));
        return aNum - bNum;
      });
      
      setQuestions(sortedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearchTerm]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (onRefresh) {
      fetchQuestions();
    }
  }, [onRefresh, fetchQuestions]);

  const exportToCSV = () => {
    const headers = ['QuestionNo', 'Type', 'Content'];
    const csvContent = [
      headers.join(','),
      ...questions.map(q => [
        q.questionNo,
        q.type,
        `"${q.content.replace(/"/g, '""')}"` // Escape quotes in content
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-4">Loading questions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {filter ? `${filter} Questions (${questions.length})` : `All Questions (${questions.length})`}
          </h2>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              
              // Clear any existing timer
              if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
              
              // Set a new timer
              searchDebounceTimer.current = setTimeout(() => {
                setDebouncedSearchTerm(value);
              }, 1000); // 1 second delay
            }}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-white p-4 rounded-lg shadow space-y-2 relative"
          >
            <div className="flex justify-between items-start">
              {editingId === question.id ? (
                <input
                  type="text"
                  value={editQuestionNo}
                  onChange={(e) => setEditQuestionNo(e.target.value)}
                  className="font-medium text-gray-600 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className="font-medium text-gray-600">
                  {question.questionNo}
                </span>
              )}
              <span className="px-2 py-1 text-sm rounded bg-gray-100">
                {question.type}
              </span>
            </div>
            {editingId === question.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        await updateQuestion(question.id, { 
                          content: editContent,
                          questionNo: editQuestionNo 
                        });
                        setEditingId(null);
                        setEditContent('');
                        setEditQuestionNo('');
                        fetchQuestions();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to update');
                      }
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                      setEditQuestionNo('');
                    }}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-800">{question.content}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(question.id);
                      setEditContent(question.content);
                      setEditQuestionNo(question.questionNo);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this question?')) {
                        try {
                          await deleteQuestion(question.id);
                          fetchQuestions();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to delete');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          No questions found.
        </div>
      )}
    </div>
  );
}
