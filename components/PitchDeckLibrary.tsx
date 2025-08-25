
import React, { useState, useCallback } from 'react';
import { generatePitch } from '../services/geminiService';
import type { PitchContent } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { MarkdownRenderer } from './ui/MarkdownRenderer';
import { BuildingStorefrontIcon, BuildingOffice2Icon, RocketLaunchIcon, AcademicCapIcon, ExclamationTriangleIcon, SparklesIcon } from './icons/Icons';

const industries = [
  { name: 'Restaurant', icon: <BuildingStorefrontIcon className="w-6 h-6" /> },
  { name: 'Real Estate', icon: <BuildingOffice2Icon className="w-6 h-6" /> },
  { name: 'Startup', icon: <RocketLaunchIcon className="w-6 h-6" /> },
  { name: 'Education', icon: <AcademicCapIcon className="w-6 h-6" /> },
];

const PitchSkeleton = () => (
    <Card>
        <div className="p-6 space-y-5">
            <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
             {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3 pt-2">
                    <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700 animate-shimmer"></div>
                </div>
            ))}
        </div>
    </Card>
);

const PitchDeckLibrary: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [painPoints, setPainPoints] = useState<string>('');
  const [pitch, setPitch] = useState<PitchContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectIndustry = (industry: string) => {
    setSelectedIndustry(industry);
    // Reset previous results when a new industry is chosen
    setPitch(null);
    setError(null);
    setClientName('');
    setPainPoints('');
  };

  const handleGeneratePitch = useCallback(async () => {
    if (!selectedIndustry) return;

    setIsLoading(true);
    setError(null);
    setPitch(null);

    try {
      const result = await generatePitch(selectedIndustry, clientName, painPoints);
      setPitch(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndustry, clientName, painPoints]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
            Pre-Built Pitch Deck Library
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            1. Select an industry to get started.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.name}
                onClick={() => handleSelectIndustry(industry.name)}
                disabled={isLoading}
                className={`flex flex-col items-center justify-center gap-2 p-4 text-center rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedIndustry === industry.name
                    ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
              >
                {industry.icon}
                <span className="font-medium text-sm">{industry.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
      
      {selectedIndustry && (
        <Card>
          <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  2. Personalize Your Pitch (Optional)
                </h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add specific client details for a more targeted and effective pitch.
                </p>
              </div>
              <div className='space-y-3'>
                <Input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client's Business Name"
                    disabled={isLoading}
                    aria-label="Client's Business Name"
                />
                <Input
                    type="text"
                    value={painPoints}
                    onChange={(e) => setPainPoints(e.target.value)}
                    placeholder="Specific Pain Points or Goals (e.g., 'needs more online bookings')"
                    disabled={isLoading}
                    aria-label="Specific Pain Points or Goals"
                />
              </div>
              <div className="pt-2">
                <Button onClick={handleGeneratePitch} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? `Generating for ${selectedIndustry}...` : 'Generate Pitch'}
                </Button>
              </div>
          </div>
        </Card>
      )}


      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && <PitchSkeleton />}

      {pitch && (
        <Card className="animate-fade-in-up">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Your Personalized Pitch for: <span className="text-sky-500">{clientName || selectedIndustry}</span>
            </h3>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer content={pitch.text} />
            </div>
          </div>
        </Card>
      )}

       {!selectedIndustry && !isLoading && !pitch && !error && (
        <Card>
            <div className="p-10 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    Select an industry above to get started.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
};

export default PitchDeckLibrary;