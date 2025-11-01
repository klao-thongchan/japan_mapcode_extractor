
import React from 'react';
import { DEMO_TEXT } from '../constants';

interface InputPanelProps {
  rawText: string;
  setRawText: (text: string) => void;
  onExtract: () => void;
  isLoading: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ rawText, setRawText, onExtract, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
      <h2 className="text-2xl font-semibold text-slate-700 mb-4">Input Text</h2>
      <textarea
        className="flex-grow w-full p-4 border border-slate-300 rounded-lg text-base leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste your list of places here, one per line..."
        rows={15}
      />
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onExtract}
          disabled={isLoading || !rawText.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Extract & Enrich'
          )}
        </button>
        <button
          onClick={() => setRawText(DEMO_TEXT)}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-50 transition-colors"
        >
          Load Demo Data
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
