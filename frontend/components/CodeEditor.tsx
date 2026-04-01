
import React from 'react';
import type { ChangeEvent } from 'react';
import { ClearIcon } from '../constants';

interface CodeEditorProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  onClear: () => void;
}

export function CodeEditor({ value, onChange, disabled, onClear }: CodeEditorProps): React.ReactNode {
  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-inner border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-700/50 border-b border-gray-700">
        <label htmlFor="html-input" className="text-sm font-semibold text-gray-300">
          HTML Input
        </label>
        <button
          onClick={onClear}
          className="p-1 rounded-md text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
          aria-label="Clear input"
        >
          <ClearIcon className="w-5 h-5" />
        </button>
      </div>
      <textarea
        id="html-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="<!-- Paste your HTML code here -->
<div style='background-color: blue; padding: 20px;'>
  <h1 class='title' style='color: white;'>Hello World!</h1>
  <p>This is a paragraph.</p>
</div>"
        className="w-full flex-grow p-4 bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder-gray-500 disabled:opacity-50"
        spellCheck="false"
      />
    </div>
  );
}
