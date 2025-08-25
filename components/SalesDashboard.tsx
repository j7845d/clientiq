
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Input } from './ui/Input';
import { SparklesIcon, ExclamationTriangleIcon, PlusIcon, EnvelopeIcon } from './icons/Icons';
import { getFollowUpSuggestion } from '../services/geminiService';
import type { Client } from '../types';
import { EmailAssistantModal } from './EmailAssistantModal';
import { Label } from './ui/Label';

const salesTarget = 100000;

// Helper to format currency
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

const MetricCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <Card className="p-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
);

interface SalesDashboardProps {
    clients: Client[];
    onAddClient: (clientData: Pick<Client, 'name' | 'value' | 'status' | 'email' | 'phone'>) => Promise<void>;
    isLoading: boolean;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ clients, onAddClient, isLoading: isLoadingClients }) => {
    const [suggestion, setSuggestion] = useState<{ clientName: string; reason: string } | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // State for adding a new lead
    const [isAddingLead, setIsAddingLead] = useState<boolean>(false);
    const [newLeadName, setNewLeadName] = useState('');
    const [newLeadValue, setNewLeadValue] = useState('');
    const [newLeadEmail, setNewLeadEmail] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');


    // State for Email Assistant Modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);


    const metrics = useMemo(() => {
        const leadsAdded = clients.length;
        const callsScheduled = clients.filter(c => c.status !== 'New Lead' && c.status !== 'Closed - Lost').length;
        const closedWon = clients.filter(c => c.status === 'Closed - Won').length;
        const conversionRatio = callsScheduled > 0 ? ((closedWon / callsScheduled) * 100).toFixed(1) : '0.0';
        const totalWonValue = clients.filter(c => c.status === 'Closed - Won').reduce((sum, c) => sum + c.value, 0);
        const targetProgress = ((totalWonValue / salesTarget) * 100).toFixed(1);

        return { leadsAdded, callsScheduled, conversionRatio, totalWonValue, targetProgress };
    }, [clients]);

    const handleGetSuggestion = async () => {
        setIsLoadingSuggestion(true);
        setError(null);
        setSuggestion(null);
        try {
            const result = await getFollowUpSuggestion(clients.filter(c => c.status !== 'Closed - Won' && c.status !== 'Closed - Lost'));
            setSuggestion(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleAddNewLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLeadName.trim() || !newLeadValue.trim() || Number(newLeadValue) <= 0 || !newLeadEmail.trim()) {
            return;
        }

        await onAddClient({
            name: newLeadName.trim(),
            value: Number(newLeadValue),
            status: 'New Lead',
            email: newLeadEmail.trim(),
            phone: newLeadPhone.trim(),
        });

        // Reset form
        setNewLeadName('');
        setNewLeadValue('');
        setNewLeadEmail('');
        setNewLeadPhone('');
        setIsAddingLead(false);
    };

    const handleDraftEmail = (client: Client) => {
        setSelectedClient(client);
        setIsEmailModalOpen(true);
    };
    
    const statusColorMap: { [key in Client['status']]: string } = {
        'New Lead': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Contacted': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        'Follow-up Needed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Proposal Sent': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Closed - Won': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Closed - Lost': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    return (
        <>
            <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Total Leads" value={metrics.leadsAdded.toString()} description="All clients in the pipeline" />
                    <MetricCard title="Active Deals" value={metrics.callsScheduled.toString()} description="Leads contacted or in talks" />
                    <MetricCard title="Conversion Ratio" value={`${metrics.conversionRatio}%`} description="From active deals to closed-won" />
                    <MetricCard title="Monthly Target Progress" value={`${metrics.targetProgress}%`} description={`Achieved ${formatCurrency(metrics.totalWonValue)} of ${formatCurrency(salesTarget)}`} />
                </div>

                {/* AI Suggestion + Client List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                         <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-sky-500" />
                                    AI Sales Coach
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Not sure who to call? Get an AI-powered suggestion for your next follow-up.
                                </p>
                                <Button onClick={handleGetSuggestion} disabled={isLoadingSuggestion} className="w-full">
                                    {isLoadingSuggestion && <Spinner className="w-5 h-5 mr-2" />}
                                    {isLoadingSuggestion ? 'Analyzing...' : 'Suggest Follow-Up'}
                                </Button>

                                {error && (
                                    <div className="mt-4 bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {suggestion && (
                                    <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-500/20 animate-fade-in-up">
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            Focus on: <span className="text-sky-600 dark:text-sky-400">{suggestion.clientName}</span>
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{suggestion.reason}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                        Client Tracker
                                    </h3>
                                    {!isAddingLead && (
                                        <Button onClick={() => setIsAddingLead(true)} className="!px-3 !py-1.5 text-xs">
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Add Lead
                                        </Button>
                                    )}
                                </div>
                                
                                {isAddingLead && (
                                    <form onSubmit={handleAddNewLead} className="p-4 mb-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                                        <h4 className="font-medium text-sm text-slate-800 dark:text-white">New Lead Details</h4>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="new-lead-name" className="sr-only">Client Name</Label>
                                                <Input
                                                    id="new-lead-name"
                                                    type="text"
                                                    placeholder="Client Name"
                                                    value={newLeadName}
                                                    onChange={(e) => setNewLeadName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="new-lead-value" className="sr-only">Deal Value</Label>
                                                <Input
                                                    id="new-lead-value"
                                                    type="number"
                                                    placeholder="Deal Value ($)"
                                                    value={newLeadValue}
                                                    onChange={(e) => setNewLeadValue(e.target.value)}
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                             <div>
                                                <Label htmlFor="new-lead-email" className="sr-only">Email</Label>
                                                <Input
                                                    id="new-lead-email"
                                                    type="email"
                                                    placeholder="Client Email"
                                                    value={newLeadEmail}
                                                    onChange={(e) => setNewLeadEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                             <div>
                                                <Label htmlFor="new-lead-phone" className="sr-only">Phone (Optional)</Label>
                                                <Input
                                                    id="new-lead-phone"
                                                    type="tel"
                                                    placeholder="Phone (Optional)"
                                                    value={newLeadPhone}
                                                    onChange={(e) => setNewLeadPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <Button type="button" onClick={() => setIsAddingLead(false)} className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
                                                Cancel
                                            </Button>
                                            <Button type="submit">
                                                Save Lead
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                 {isLoadingClients ? (
                                    <div className="text-center py-10">
                                        <Spinner className="w-8 h-8 mx-auto text-sky-500" />
                                    </div>
                                 ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                            <thead className="bg-slate-50 dark:bg-slate-800">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deal Value</th>
                                                    <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                                                {clients.length > 0 ? clients.map((client) => (
                                                    <tr key={client.id}>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{client.name}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            {client.email && <div className="text-slate-800 dark:text-slate-200">{client.email}</div>}
                                                            {client.phone && <div className="text-slate-500 dark:text-slate-400 text-xs">{client.phone}</div>}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[client.status]}`}>
                                                                {client.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatCurrency(client.value)}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleDraftEmail(client)}
                                                                title={client.email ? `Draft email to ${client.name}` : 'No email available'}
                                                                disabled={!client.email}
                                                                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <EnvelopeIcon className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                                                            No clients yet. Click "Add Lead" to get started.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                 )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <EmailAssistantModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                client={selectedClient}
            />
        </>
    );
};

export default SalesDashboard;
