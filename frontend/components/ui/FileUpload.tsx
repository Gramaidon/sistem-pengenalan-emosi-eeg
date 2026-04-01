import React, { useRef } from 'react';

interface FileUploadProps {
  label: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
}

export function FileUpload({ 
  label, 
  description, 
  file, 
  onFileChange,
  accept = ".mat"  
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files?.length) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div 
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-52"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept={accept}
          className="hidden"
        />
        
        {file ? (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <svg 
              className="h-8 w-8 text-blue-500 mb-2" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-sm text-gray-600 mb-1">Selected file:</p>
            <p className="text-sm font-medium text-blue-600">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="mt-2 text-xs text-red-500 hover:text-red-700 hover:font-bold transition-all duration-200"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <svg 
              className="h-12 w-12 text-gray-400" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            <p className="mt-2 text-base font-normal text-blue-600 hover:text-blue-700 hover:font-bold transition-all duration-200">
              Upload a file
            </p>
            <p className="mt-1 text-sm text-gray-500">
              or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Select the dataset file (.mat)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
