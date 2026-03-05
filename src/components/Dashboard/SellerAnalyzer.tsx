import React, { useState } from 'react';
import { Store, Search, Shield, Package, ShoppingBag, ExternalLink, Info } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

export const SellerAnalyzer: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                            <Store className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('sellers.title')}</h2>
                            <p className="text-sm text-gray-500">Analyze competitor stores and their product catalogs.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Insert Seller ID (e.g. A3ABCDEFGH1234)..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all dark:text-white"
                        />
                    </div>
                    <button className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2">
                        Analyze Store
                    </button>
                </div>
            </div>

            {/* Feature Teaser */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Shield, title: 'Store Health', desc: 'Monitor the evolution of reviews and feedback of the store.' },
                    { icon: Package, title: 'Brand Distribution', desc: 'See which brands the competitor is liquidating or holding.' },
                    { icon: ShoppingBag, title: 'Bestseller Capture', desc: 'Identify the most profitable products in the competitor\'s catalog.' }
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-dark-700 rounded-lg flex items-center justify-center mb-4">
                            <feature.icon className="w-5 h-5 text-gray-400" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                        <p className="text-sm text-gray-500">{feature.desc}</p>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="p-6 bg-brand-50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-800/50 flex gap-4">
                <Info className="w-6 h-6 text-brand-600 shrink-0" />
                <div>
                    <h4 className="font-bold text-brand-900 dark:text-brand-300 mb-1">Coming Soon: Store catalog bulk export</h4>
                    <p className="text-sm text-brand-700 dark:text-brand-400">
                        We are finalizing the integration with the Seller Central API to allow you to export all products from a competitor's store directly to your Product Finder.
                    </p>
                </div>
            </div>
        </div>
    );
};
