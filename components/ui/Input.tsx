import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500
        focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500
        disabled:bg-slate-50 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
        dark:disabled:border-slate-600 dark:disabled:text-slate-400
        ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
