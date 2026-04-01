import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.ReactNode {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
