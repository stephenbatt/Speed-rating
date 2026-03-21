import React, { useState } from 'react';
import { parseSimpleFormat, HorseData } from '@/utils/raceDataParser';

interface DataInputProps {
  onDataParsed: (data: HorseData[]) => void;
  isProcessing?: boolean;
}

const DataInput: React.FC<DataInputProps> = ({ onDataParsed, isProcessing = false }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    if (!inputText.trim()) return;

    try {
      const parsed = parseSimpleFormat(inputText);

      console.log("Parsed horses:", parsed);

      // 🔴 THIS is what was missing before
      onDataParsed(parsed);

    } catch (err) {
      console.error("Parsing failed:", err);
    }
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <div className="p-4 border rounded-xl bg-white">
      <h2 className="text-lg font-bold mb-2">Race Data Input</h2>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste your Equibase data here..."
        className="w-full h-64 p-2 border rounded mb-4"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Parse Race Data
        </button>

        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default DataInput;
