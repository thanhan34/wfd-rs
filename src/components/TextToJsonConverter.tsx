import React, { useState } from 'react';

interface TextToJsonConverterProps {
  onJsonGenerated: (jsonData: string) => void;
}

export default function TextToJsonConverter({ onJsonGenerated }: TextToJsonConverterProps) {
  const [inputText, setInputText] = useState('');

  const convertToJson = () => {
    try {
      // Split the input text into lines
      const lines = inputText.split('\n').filter(line => line.trim());

      // Process each line
      const questions = lines.map(line => {
        // Match the pattern: #number WFD/RS text
        const match = line.match(/^(#\d+\s*(WFD|RS))\s*(.+)$/);
        if (!match) return null;

        const [, questionNo, type, content] = match;
        return {
          questionNo: questionNo.trim(),
          type: type.trim(),
          content: content.trim()
        };
      }).filter(q => q !== null); // Remove any null entries

      // Generate the JSON string with proper formatting
      const jsonString = JSON.stringify(questions, null, 2);
      onJsonGenerated(jsonString);
    } catch (error) {
      console.error('Error converting to JSON:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Text (Format: #number WFD content)
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-indigo-500 focus:ring-indigo-500 h-48"
          placeholder="#418 WFD University graduates lose their time finding jobs.
#1406 WFD Music has the ability to shape our emotions.
#123 RS Please close the door when you leave.
#456 RS The lecture will begin in ten minutes."
        />
      </div>

      <button
        onClick={convertToJson}
        className="inline-flex justify-center rounded-md border border-transparent 
          bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm 
          hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 
          focus:ring-offset-2"
      >
        Convert to JSON
      </button>
    </div>
  );
}
