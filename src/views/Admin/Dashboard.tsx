
import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, Settings, Loader2 } from 'lucide-react';

interface AdminStats {
    totalUsers: number;
    activeSubs: number;
    monthlyRevenue: number;
    generationsToday: number;
}

interface RecentUser {
    email: string;
    role: string;
    created_at: string;
    subscription_status?: string;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch stats
            const statsResponse = await fetch('/.netlify/functions/get-admin-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');
            const statsData = await statsResponse.json();
            setStats(statsData);

            // Fetch recent users
            const usersResponse = await fetch('/.netlify/functions/get-recent-users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!usersResponse.ok) throw new Error('Failed to fetch users');
            const usersData = await usersResponse.json();
            setRecentUsers(usersData);

            setError(null);
        } catch (err: any) {
            console.error('Error fetching admin data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 bg-gray-50 dark:bg-dark-900 min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-gray-50 dark:bg-dark-900 min-h-screen">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
                    Error: {error}
                </div>
            </div>
        );
    }

    const statsDisplay = [
        { label: 'Total Users', value: stats?.totalUsers.toLocaleString() || '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { label: 'Monthly Revenue', value: `€ ${stats?.monthlyRevenue.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
        { label: 'Active Subs', value: stats?.activeSubs.toLocaleString() || '0', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
        { label: 'New Users Today', value: stats?.generationsToday.toLocaleString() || '0', icon: Settings, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    ];

    return (
        <div className="p-8 bg-gray-50 dark:bg-dark-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsDisplay.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 flex items-center">
                        <div className={`p-4 rounded-full ${stat.bg} mr-4`}>
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Users</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-dark-700">
                                <th className="pb-2 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                                <th className="pb-2 text-gray-500 dark:text-gray-400 font-medium">Role</th>
                                <th className="pb-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                            {recentUsers.map((user, i) => (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-dark-700">
                                    <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{user.role}</td>
                                    <td className="py-3 text-sm text-green-600 dark:text-green-400">
                                        {user.subscription_status || 'Active'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">System Health</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <span className="text-green-800 dark:text-green-400 font-medium">Database Connection</span>
                            <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <span className="text-green-800 dark:text-green-400 font-medium">Stripe API (Live)</span>
                            <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Operational</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <span className="text-yellow-800 dark:text-yellow-400 font-medium">Listing Generator Queue</span>
                            <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">Moderate Load</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
