
import React from 'react';
import { Users, DollarSign, Activity, Settings } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    // Mock Data for now
    const stats = [
        { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Monthly Revenue', value: '€ 4,500', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Active Subs', value: '89', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Generations Today', value: '432', icon: Settings, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                        <div className={`p-4 rounded-full ${stat.bg} mr-4`}>
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Users</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-2 text-gray-500 font-medium">Email</th>
                                <th className="pb-2 text-gray-500 font-medium">Role</th>
                                <th className="pb-2 text-gray-500 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="group hover:bg-gray-50">
                                    <td className="py-3 text-sm text-gray-700">user{i}@example.com</td>
                                    <td className="py-3 text-sm text-gray-600">USER</td>
                                    <td className="py-3 text-sm text-green-600">Active</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">System Health</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-green-800 font-medium">Database Connection</span>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-green-800 font-medium">Stripe API (Live)</span>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Operational</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span className="text-yellow-800 font-medium">Listing Generator Queue</span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Moderate Load</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
