'use client';

import { ReactNode } from 'react';

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface LoadingButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'label';
  htmlFor?: string;
  className?: string;
}

const LoadingButton = ({ 
  onClick, 
  isLoading = false, 
  disabled = false, 
  children, 
  variant = 'blue',
  size = 'md',
  type = 'button',
  htmlFor,
  className = ''
}: LoadingButtonProps) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    blue: isLoading || disabled
      ? 'bg-blue-400 cursor-not-allowed focus:ring-blue-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer',
    green: isLoading || disabled
      ? 'bg-green-400 cursor-not-allowed focus:ring-green-500'
      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500 cursor-pointer',
    purple: isLoading || disabled
      ? 'bg-purple-400 cursor-not-allowed focus:ring-purple-500'
      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 cursor-pointer',
    red: isLoading || disabled
      ? 'bg-red-400 cursor-not-allowed focus:ring-red-500'
      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500 cursor-pointer',
    gray: isLoading || disabled
      ? 'bg-gray-400 cursor-not-allowed focus:ring-gray-500'
      : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 cursor-pointer'
  };

  const baseClasses = "inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2";
  const finalClassName = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (type === 'label') {
    return (
      <label htmlFor={htmlFor} className={finalClassName}>
        {isLoading && <LoadingSpinner />}
        {children}
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={finalClassName}
    >
      {isLoading && <LoadingSpinner />}
      {children}
    </button>
  );
};

export default LoadingButton;