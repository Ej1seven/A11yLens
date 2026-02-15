import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'info' | 'success' | 'neutral';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  const variantStyles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-accent-100 text-primary-800 border-accent-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}
