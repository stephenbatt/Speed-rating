import React, { useState } from 'react';
import { Upload, FileText, Clipboard, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { parseSimpleFormat, HorseData } from '@/utils/raceDataParser';

interface DataInputProps {
  onDataParsed: (data: HorseData[]) => void;
  isProcessing?: boolean;
}

const DataInput: React.FC<DataInputProps> = ({ onDataParsed, isProcessing = false }) => {
  const [inputText, setInputText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showInput, setShowInput] = useState(true);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setPasteStatus('success');
      setTimeout(() => setPasteStatus('idle'), 2000);
    } catch (err) {
      setPasteStatus('error');
      setTimeout(() => setPasteStatus('idle'), 2000);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      const parsed = parseSimpleFormat(inputText);

      console.log("Parsed horses:", parsed);

      onDataParsed(parsed); // ✅ THIS FIXES EVERYTHING
    }
  };

  const handleClear = () => {
    setInputText('');
    setPasteStatus('idle');
  };

  const handleLoadSample = () => {
    setInputText(`Paste your race data here...`);
    setPasteStatus('success');
    setTimeout(() => setPasteStatus('idle'), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Race Data Input</h2>
              <p className="text-sm text-slate-300">Paste your Equibase PP data below</p>
            </div>
          </div>
          <button
            onClick={() => setShowInput(!showInput)}
            className="text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-slate-700"
          >
            {showInput ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {showInput && (
        <div className="p-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={handlePaste} className="px-4 py-2 bg-slate-100 rounded-lg">
              Paste
            </button>

            <button onClick={handleLoadSample} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
              Load Sample
            </button>

            {inputText && (
              <button onClick={handleClear} className="px-4 py-2 bg-gray-100 rounded-lg">
                Clear
              </button>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-64 p-4 border rounded-xl"
          />

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim()}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl"
            >
              Parse Race Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInput;
