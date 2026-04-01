
import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon } from '../constants';

interface CodeDisplayProps {
  code: string;
  isLoading: boolean;
}

export function CodeDisplay({ code, isLoading }: CodeDisplayProps): React.ReactNode {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
    }
  };
  
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  useEffect(() => {
    // Reset copied state when code changes
    setIsCopied(false);
  }, [code]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-inner border border-gray-700 overflow-hidden relative">
      <div className="flex items-center justify-between p-3 bg-gray-700/50 border-b border-gray-700">
        <p className="text-sm font-semibold text-gray-300">
          React Output
        </p>
        <button
          onClick={handleCopy}
          disabled={!code}
          className="p-1 rounded-md text-gray-400 hover:bg-gray-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Copy to clipboard"
        >
          {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>
      <div className="relative w-full flex-grow overflow-auto">
        <pre className="h-full w-full">
          <code className="language-tsx font-mono text-sm p-4 block h-full w-full whitespace-pre-wrap">
            {isLoading ? (
              <span className="text-gray-500 animate-pulse">Generating component...</span>
            ) : code ? (
              code
            ) : (
              <span className="text-gray-500">Your generated React code will appear here...</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
