import React, { useState } from 'react';
import { Network, Search, GitMerge, Share2, Zap, Heart, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

export const TrafficMap: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                            <Network className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('traffic.title')}</h2>
                            <p className="text-sm text-gray-500">Visualize buying relationships and "Frequently Bought Together" traffic.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by ASIN to see traffic map..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all dark:text-white"
                        />
                    </div>
                    <button className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2">
                        Build Map
                    </button>
                </div>
            </div>

            {/* Empty State / Visualization Teaser */}
            <div className="bg-white dark:bg-dark-800 p-12 rounded-2xl border border-gray-100 dark:border-dark-700 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center animate-pulse">
                        <Share2 className="w-10 h-10 text-brand-500" />
                    </div>
                    {/* Floating icons to simulate nodes */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-white dark:bg-dark-700 rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-dark-600">
                        <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="absolute -bottom-2 -left-6 w-10 h-10 bg-white dark:bg-dark-700 rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-dark-600">
                        <Heart className="w-5 h-5 text-red-400" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Traffic visualization is coming soon</h3>
                <p className="text-gray-500 max-w-md mb-8">
                    Discover how traffic flows between products. Identify nodes of products that are frequently bought together to optimize your bundles and ads.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left w-full max-w-2xl">
                    <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                            <GitMerge className="w-4 h-4 text-brand-600" />
                            Cross-Selling Analysis
                        </h4>
                        <p className="text-xs text-gray-500">See which products steal your traffic or complement your listing.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                            <Network className="w-4 h-4 text-brand-600" />
                            Frequently Bought Together
                        </h4>
                        <p className="text-xs text-gray-500">Map out the "gold nodes" of associations directly from Amazon data.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
