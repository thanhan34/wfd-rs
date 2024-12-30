'use client';

import React from 'react';
import QuestionInput from '../src/components/QuestionInput';
import QuestionList from '../src/components/QuestionList';
import BulkImport from '../src/components/BulkImport';
import BulkWFDSearch from '../src/components/BulkWFDSearch';
import BulkRSSearch from '../src/components/BulkRSSearch';

export default function Home() {
  const [activeTab, setActiveTab] = React.useState<'all' | 'WFD' | 'RS' | 'bulk' | 'wfdSearch' | 'rsSearch'>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = React.useState(false);

  const handleQuestionAdded = () => {
    setRefreshTrigger(prev => !prev);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Question Management System
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
        {(['all', 'WFD', 'RS', 'bulk', 'wfdSearch', 'rsSearch'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? 'All Questions' : 
               tab === 'bulk' ? 'Bulk Import' : 
               tab === 'wfdSearch' ? 'WFD Search' :
               tab === 'rsSearch' ? 'RS Search' :
               `${tab} Questions`}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <section>
          {activeTab === 'bulk' ? (
            <BulkImport onImportComplete={handleQuestionAdded} />
          ) : activeTab === 'wfdSearch' ? (
            <BulkWFDSearch />
          ) : activeTab === 'rsSearch' ? (
            <BulkRSSearch />
          ) : (
            <>
              {/* Question Input Section */}
              <div className="mb-8">
                <QuestionInput onQuestionAdded={handleQuestionAdded} />
              </div>
              
              {/* Question List */}
              <QuestionList
                filter={activeTab === 'all' ? undefined : activeTab}
                onRefresh={() => setRefreshTrigger(prev => !prev)}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
