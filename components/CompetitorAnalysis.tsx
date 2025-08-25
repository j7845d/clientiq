
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeCompetitor, getSuggestions } from '../services/geminiService';
import type { CompetitorReport } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { MarkdownRenderer } from './ui/MarkdownRenderer';
import { SuggestionBox } from './ui/SuggestionBox';
import { LinkIcon, ExclamationTriangleIcon } from './icons/Icons';

const ReportSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <div className="p-6 space-y-5">
                    <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                            <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
        <div>
            <Card>
                <div className="p-6 space-y-4">
                    <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                             <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    </div>
);


const CompetitorAnalysis: React.FC = () => {
  const [businessName, setBusinessName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for suggestions
  const [suggestions, setSuggestions] = useState<{ business: string[]; location: string[] }>({ business: [], location: [] });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<'business' | 'location' | null>(null);
  const [focusedInput, setFocusedInput] = useState<'business' | 'location' | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const businessInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateReport = useCallback(async () => {
    if (!businessName.trim()) {
      setError('Please enter a business name.');
      return;
    }
    setFocusedInput(null);
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeCompetitor(businessName, location);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [businessName, location]);

  const fetchSuggestions = useCallback(async (query: string, type: 'business' | 'location') => {
    if (query.trim().length < 2) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }
    setIsLoadingSuggestions(type);
    const result = await getSuggestions(query, type, type === 'business' ? location : undefined);
    setSuggestions(prev => ({ ...prev, [type]: result }));
    setIsLoadingSuggestions(null);
    setActiveIndex(0);
  }, [location]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (focusedInput === 'business') {
        fetchSuggestions(businessName, 'business');
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [businessName, focusedInput, fetchSuggestions]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (focusedInput === 'location') {
        fetchSuggestions(location, 'location');
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [location, focusedInput, fetchSuggestions]);

  const handleSelectSuggestion = (suggestion: string, type: 'business' | 'location') => {
    if (type === 'business') {
      setBusinessName(suggestion);
      businessInputRef.current?.focus();
    } else {
      setLocation(suggestion);
      locationInputRef.current?.focus();
    }
    setSuggestions({ business: [], location: [] });
    setFocusedInput(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'business' | 'location') => {
    const currentSuggestions = suggestions[type];
    if (currentSuggestions.length === 0) {
      if (e.key === 'Enter') handleGenerateReport();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % currentSuggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + currentSuggestions.length) % currentSuggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentSuggestions[activeIndex]) {
          handleSelectSuggestion(currentSuggestions[activeIndex], type);
        } else {
            handleGenerateReport();
        }
        break;
      case 'Escape':
        setFocusedInput(null);
        break;
      case 'Tab':
        setFocusedInput(null);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Competitor Analysis (Lite)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Enter your client’s business name and location to get a deep-dive into their online presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 items-start">
            <div className="relative w-full sm:flex-grow">
              <Input
                ref={businessInputRef}
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onFocus={() => setFocusedInput('business')}
                onBlur={() => setTimeout(() => { if (document.activeElement !== businessInputRef.current) setFocusedInput(null); }, 150)}
                onKeyDown={(e) => handleKeyDown(e, 'business')}
                placeholder="e.g., 'The Corner Cafe' or 'restaurants'"
                disabled={isLoading}
                className="w-full"
                aria-label="Business Name"
                aria-autocomplete="list"
              />
              {focusedInput === 'business' && (suggestions.business.length > 0 || isLoadingSuggestions === 'business') && (
                <SuggestionBox
                  suggestions={suggestions.business}
                  isLoading={isLoadingSuggestions === 'business'}
                  onSelect={(suggestion) => handleSelectSuggestion(suggestion, 'business')}
                  activeIndex={activeIndex}
                />
              )}
            </div>
            <div className="relative w-full sm:w-1/3">
              <Input
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setFocusedInput('location')}
                onBlur={() => setTimeout(() => { if (document.activeElement !== locationInputRef.current) setFocusedInput(null); }, 150)}
                onKeyDown={(e) => handleKeyDown(e, 'location')}
                placeholder="Location (e.g. 'New York')"
                disabled={isLoading}
                className="w-full"
                aria-label="Location"
                aria-autocomplete="list"
              />
              {focusedInput === 'location' && (suggestions.location.length > 0 || isLoadingSuggestions === 'location') && (
                 <SuggestionBox
                  suggestions={suggestions.location}
                  isLoading={isLoadingSuggestions === 'location'}
                  onSelect={(suggestion) => handleSelectSuggestion(suggestion, 'location')}
                  activeIndex={activeIndex}
                />
              )}
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading || !businessName.trim()} className="w-full sm:w-auto">
              {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : null}
              {isLoading ? 'Analyzing...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !report && <ReportSkeleton />}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Analysis for: <span className="text-sky-500">{businessName}</span>
                </h3>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownRenderer content={report.text} />
                </div>
              </div>
            </Card>
          </div>
          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Sources
                </h3>
                {report.sources && report.sources.length > 0 ? (
                  <ul className="space-y-3">
                    {report.sources.map((source, index) => (
                      source.web && source.web.uri && (
                        <li key={index}>
                          <a
                            href={source.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline break-all group"
                          >
                            <p className="font-medium truncate group-hover:text-sky-500">{source.web.title || source.web.uri}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{source.web.uri}</p>
                          </a>
                        </li>
                      )
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No web sources were cited for this report.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorAnalysis;