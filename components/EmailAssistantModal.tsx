
import React, { useState, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Label } from './ui/Label';
import { EnvelopeIcon, ClipboardIcon, SparklesIcon, ExclamationTriangleIcon } from './icons/Icons';
import { generateFollowUpEmail } from '../services/geminiService';
import type { Client } from '../types';

const emailTones = ["Friendly Check-in", "Formal Proposal Follow-up", "Quick Question", "Gentle Nudge"];

interface EmailAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export const EmailAssistantModal: React.FC<EmailAssistantModalProps> = ({ isOpen, onClose, client }) => {
  const [tone, setTone] = useState(emailTones[0]);
  const [keyPoints, setKeyPoints] = useState('');
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);
    setDraft(null);
    try {
      const result = await generateFollowUpEmail(client, tone, keyPoints);
      setDraft(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [client, tone, keyPoints]);

  const handleCopy = () => {
    if (!draft) return;
    const fullEmail = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Reset state when modal opens/closes or client changes
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => { // allow for closing animation if any
        setTone(emailTones[0]);
        setKeyPoints('');
        setDraft(null);
        setError(null);
        setIsLoading(false);
      }, 200);
    }
  }, [isOpen]);

  if (!client) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Email Assistant for ${client.name}`}>
      <div className="space-y-4">
        <div>
            <Label>Select Email Tone</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                {emailTones.map(t => (
                    <button 
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                            tone === t 
                            ? 'bg-sky-500 border-sky-500 text-white' 
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <Label htmlFor="key-points">Optional: Key Points to Include</Label>
            <textarea
                id="key-points"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="e.g., Mention our new case study about..."
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
        </div>
        <div className="pt-2">
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                {isLoading ? 'Generating Draft...' : 'Generate Draft'}
            </Button>
        </div>

        {error && (
            <div className="bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{error}</span>
            </div>
        )}

        {draft && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Generated Draft</h4>
                    <Button onClick={handleCopy} className="!px-3 !py-1.5 text-xs bg-slate-600 hover:bg-slate-700">
                        <ClipboardIcon className="w-4 h-4 mr-1.5" />
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
                <div>
                    <Label className="!font-semibold">Subject</Label>
                    <p className="mt-1 text-sm p-2 bg-white dark:bg-slate-800 rounded-md">{draft.subject}</p>
                </div>
                 <div>
                    <Label className="!font-semibold">Body</Label>
                    <p className="mt-1 text-sm p-2 bg-white dark:bg-slate-800 rounded-md whitespace-pre-wrap">{draft.body}</p>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};
