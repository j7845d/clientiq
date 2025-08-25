import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import * as authService from '../services/authService';
import * as clientService from '../services/clientService';
import type { User, Client } from '../types';

interface ClientData {
    [userId: string]: Client[];
}

const MetricCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <Card className="p-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
);


const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [clientsData, setClientsData] = useState<ClientData>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allUsers, allClients] = await Promise.all([
                    authService.getAllUsers(),
                    clientService.getAllClientsData()
                ]);
                setUsers(allUsers);
                setClientsData(allClients);
            } catch (error) {
                console.error("Failed to load admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Effect to update the 'now' state periodically to refresh user statuses
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const metrics = useMemo(() => {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => clientsData[user.id] && clientsData[user.id].length > 0).length;
        const totalClients = Object.values(clientsData).flat().length;

        return { totalUsers, activeUsers, totalClients };
    }, [users, clientsData]);
    
    const userActivity = useMemo(() => {
        return users.map(user => {
            const userClients = clientsData[user.id] || [];
            const clientsManaged = userClients.length;
            
            const lastActivityTimestamp = localStorage.getItem(`user_activity_timestamp_${user.id}`);
            let status = 'Inactive';
            if (lastActivityTimestamp) {
                const lastActivityDate = new Date(lastActivityTimestamp);
                // Consider active if the last timestamp was within the last 5 minutes
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                if (lastActivityDate > fiveMinutesAgo) {
                    status = 'Active';
                }
            }

            return {
                ...user,
                clientsManaged,
                status
            };
        }).sort((a,b) => b.clientsManaged - a.clientsManaged);
    }, [users, clientsData, now]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner className="w-10 h-10 text-sky-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h2>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard title="Total Users" value={metrics.totalUsers} description="All registered users" />
                <MetricCard title="Active Users" value={metrics.activeUsers} description="Users with at least one client" />
                <MetricCard title="Total Clients Managed" value={metrics.totalClients} description="All clients across all users" />
            </div>

            {/* User Activity Table */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        User Activity
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clients Managed</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                                {userActivity.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            {user.status === 'Active' ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-pulse-green absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    <span className="text-green-600 dark:text-green-400">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="relative flex h-2 w-2">
                                                         <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                                                    </span>
                                                    <span className="text-slate-500 dark:text-slate-400">Inactive</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.clientsManaged}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboard;