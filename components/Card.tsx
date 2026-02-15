import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-[#F5F7FA] rounded-xl shadow-sm border border-[#E2E8F0] ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
