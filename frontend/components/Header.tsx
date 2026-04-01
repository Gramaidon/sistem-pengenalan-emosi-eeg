
import React from 'react';
import { LogoIcon } from '../constants';

export function Header(): React.ReactNode {
  return (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
      <div className="flex items-center justify-center gap-4">
        <LogoIcon className="w-12 h-12 text-indigo-400" />
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          HTML to React Converter
        </h1>
      </div>
      <p className="mt-2 text-md md:text-lg text-gray-400">
        Paste your HTML below and let AI transform it into a modern React component with Tailwind CSS.
      </p>
    </header>
  );
}
