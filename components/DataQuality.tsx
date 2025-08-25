
import React, { useState, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Spinner } from './ui/Spinner';
import { ExclamationTriangleIcon, SparklesIcon } from './icons/Icons';
import { verifyEmail, validateClientDataBatch } from '../services/geminiService';
import type { EmailValidationResult, RowValidationResult } from '../types';

// --- Email Verifier Component ---
const EmailVerifier: React.FC = () => {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState<EmailValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!email.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const verificationResult = await verifyEmail(email);
            setResult(verificationResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: EmailValidationResult['status']) => {
        if (status === 'Valid') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-500/30';
        if (status.startsWith('Risky')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500/30';
        if (status.startsWith('Invalid')) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-500/30';
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/20 border-slate-500/30';
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">AI Email Verifier</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Check if an email is valid, disposable, or a generic role-based address.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., contact@example.com"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        className="w-full"
                    />
                    <Button onClick={handleVerify} disabled={isLoading || !email.trim()} className="w-full sm:w-auto">
                        {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                </div>
                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                {result && (
                    <div className={`mt-4 p-4 rounded-lg border ${getStatusColor(result.status)} animate-fade-in`}>
                        <p className="font-semibold text-base">{result.status}</p>
                        <p className="text-sm">{result.reason}</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

// --- Data Validator Component ---
interface ValidatedRow {
    data: Record<string, string>;
    isValid: boolean;
    issues: string[];
}

const DataValidator: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
    const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Reset previous results
            setValidatedData([]);
            setSummary(null);
            setError(null);
        }
    };

    const parseCSV = (csvText: string): { headers: string[], rows: Record<string, string>[] } => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
            // Basic CSV parsing, may not handle all edge cases like commas in quotes perfectly.
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {} as Record<string, string>);
        });
        return { headers, rows };
    };

    const processFile = useCallback(async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setValidatedData([]);
        setSummary(null);
        setProgress('Reading file...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const { headers, rows } = parseCSV(text);
                setHeaders(headers);

                const BATCH_SIZE = 25;
                let allResults: ValidatedRow[] = [];

                for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const batch = rows.slice(i, i + BATCH_SIZE);
                    setProgress(`Analyzing rows ${i + 1} - ${Math.min(i + BATCH_SIZE, rows.length)} of ${rows.length}...`);

                    const validationResults = await validateClientDataBatch(batch);
                    
                    const batchValidatedRows = validationResults.map(res => ({
                        data: rows[i + res.originalIndex],
                        isValid: res.isValid,
                        issues: res.issues,
                    }));
                    allResults = [...allResults, ...batchValidatedRows];
                }
                
                setValidatedData(allResults);
                const invalidCount = allResults.filter(r => !r.isValid).length;
                setSummary({
                    total: allResults.length,
                    valid: allResults.length - invalidCount,
                    invalid: invalidCount,
                });

            } catch (err) {
                 setError(err instanceof Error ? err.message : 'Failed to process file.');
            } finally {
                setIsLoading(false);
                setProgress('');
            }
        };
        reader.onerror = () => {
             setError("Failed to read the file.");
             setIsLoading(false);
        }
        reader.readAsText(file);
    }, [file]);

    const MetricCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
        <div className={`p-4 rounded-lg ${className}`}>
            <h3 className="text-sm font-medium truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
    );

    return (
        <Card>
            <div className="p-6">
                 <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">AI Client Data Validator</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Upload a CSV file of your client list to check for errors and inconsistencies.
                </p>

                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center">
                    <input
                        type="file"
                        id="file-upload"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <Label htmlFor="file-upload" className={`inline-block px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${isLoading ? 'bg-slate-400 text-slate-200' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                        {file ? 'Change File' : 'Select a CSV File'}
                    </Label>
                    {file && <p className="text-sm text-slate-500 mt-2">{file.name}</p>}
                </div>
                <div className="mt-4">
                     <Button onClick={processFile} disabled={isLoading || !file} className="w-full sm:w-auto">
                        {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? progress : 'Validate Data'}
                    </Button>
                </div>

                {error && (
                    <div className="mt-4 bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
                
                {summary && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
                        <MetricCard title="Total Rows" value={summary.total} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" />
                        <MetricCard title="Valid Rows" value={summary.valid} className="bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-300" />
                        <MetricCard title="Invalid Rows" value={summary.invalid} className="bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-300" />
                    </div>
                )}

                {validatedData.length > 0 && (
                     <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    {headers.map(h => <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
                                     <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                                {validatedData.map((row, index) => (
                                    <tr key={index} className={!row.isValid ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {row.isValid ? 'Valid' : 'Invalid'}
                                            </span>
                                        </td>
                                        {headers.map(h => <td key={h} className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{row.data[h]}</td>)}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                            {row.issues.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
};

// --- Main Data Quality Component ---
const DataQuality: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Data Quality Center</h1>
            <EmailVerifier />
            <DataValidator />
        </div>
    );
};

export default DataQuality;
