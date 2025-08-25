
import React from 'react';
import { Spinner } from './Spinner';

interface SuggestionBoxProps {
  suggestions: string[];
  isLoading: boolean;
  onSelect: (suggestion: string) => void;
  activeIndex: number;
}

export const SuggestionBox: React.FC<SuggestionBoxProps> = ({ suggestions, isLoading, onSelect, activeIndex }) => {
  const boxContent = () => {
    if (isLoading) {
      return (
        <div className="p-3 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          <Spinner className="w-4 h-4 mr-2" />
          <span>Loading...</span>
        </div>
      );
    }

    if (suggestions.length === 0) {
      return null;
    }

    return (
      <ul role="listbox">
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={activeIndex === index}
            className={`cursor-pointer select-none relative py-2 px-3 text-slate-700 dark:text-slate-300 text-sm ${
              activeIndex === index ? 'bg-sky-100 dark:bg-sky-900/50' : ''
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(suggestion);
            }}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
        {boxContent()}
    </div>
  );
};
