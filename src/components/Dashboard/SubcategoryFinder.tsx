import React, { useState } from 'react';
import { Layers, Search, Filter, ArrowUpRight, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

export const SubcategoryFinder: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                            <Layers className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('subcategories.title')}</h2>
                            <p className="text-sm text-gray-500">{t('PF.desc') || 'Explore niches and subcategories for saturation analysis.'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('PF.search_placeholder') || 'Search subcategories...'}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all dark:text-white"
                        />
                    </div>
                    <button className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2">
                        {t('common.search') || 'Analyze'}
                    </button>
                </div>
            </div>

            {/* Placeholder / Empty State */}
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-dark-700 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Work in Progress</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    This module is being developed to offer deep niche saturation analysis. Soon you will be able to see opportunity scores for specific subcategories.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg text-amber-700 text-sm font-medium border border-amber-100">
                    <AlertCircle size={16} />
                    Coming Soon: Niche Opportunity Scoring
                </div>
            </div>
        </div>
    );
};
