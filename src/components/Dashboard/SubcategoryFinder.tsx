import React, { useState } from 'react';
import { Layers, Search, TrendingUp, AlertCircle, BarChart3, Target, Zap, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { searchProducts } from '../../services/amazonAuthService';

interface NicheAnalysis {
    keyword: string;
    opportunityScore: number;
    saturationScore: number;
    avgPrice: number;
    avgReviews: number;
    avgRating: number;
    dominantBrands: string[];
    topProducts: { title: string; asin: string; sales: number }[];
}

export const SubcategoryFinder: React.FC = () => {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<NicheAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const result = await searchProducts(searchTerm, 'ATVPDKIKX0DER');
            refreshUser();

            if (result && result.items && result.items.length > 0) {
                const items = result.items;

                // Calculate Metrics
                let totalSales = 0;
                let totalPrice = 0;
                let totalReviews = 0;
                let totalRating = 0;
                const brands: Record<string, number> = {};

                const topProducts = items.map((item: any) => {
                    const summary = item.summaries?.[0] || {};
                    const sales = item.estimated_sales || 100;
                    const price = summary.price?.amount || 25;
                    const reviews = item.attributes?.total_review_count?.[0]?.value || 50;
                    const rating = item.attributes?.average_rating?.[0]?.value || 4.2;
                    const brand = summary.brand || 'Unknown';

                    totalSales += sales;
                    totalPrice += price;
                    totalReviews += reviews;
                    totalRating += rating;
                    brands[brand] = (brands[brand] || 0) + 1;

                    return {
                        title: summary.itemName || 'N/A',
                        asin: item.asin,
                        sales
                    };
                }).sort((a: any, b: any) => b.sales - a.sales).slice(0, 5);

                const avgPrice = totalPrice / items.length;
                const avgReviews = totalReviews / items.length;
                const avgRating = totalRating / items.length;

                const sortedBrands = Object.entries(brands).sort((a, b) => b[1] - a[1]);
                const top3Count = sortedBrands.slice(0, 3).reduce((sum, b) => sum + b[1], 0);
                const saturationScore = (top3Count / items.length) * 100;

                const salesFactor = Math.min(totalSales / (items.length * 500), 1) * 40;
                const reviewFactor = Math.max(0, (1 - avgReviews / 2000)) * 40;
                const saturationFactor = (1 - saturationScore / 100) * 20;
                const opportunityScore = Math.round(salesFactor + reviewFactor + saturationFactor);

                setAnalysis({
                    keyword: searchTerm,
                    opportunityScore: Math.min(opportunityScore, 100),
                    saturationScore: Math.round(saturationScore),
                    avgPrice,
                    avgReviews: Math.round(avgReviews),
                    avgRating,
                    dominantBrands: sortedBrands.slice(0, 3).map(b => b[0]),
                    topProducts
                });
            } else {
                setError(t('error.no_products'));
                setAnalysis(null);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error analyzing niche');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score > 70) return 'text-green-600 bg-green-50 border-green-100';
        if (score > 40) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                            <Layers className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('subcategories.title')}</h2>
                            <p className="text-sm text-gray-500">Discover low-competition, high-demand niches.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Enter a broad niche or category (e.g. Yoga Mats, Dog Toys)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all dark:text-white shadow-inner"
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !searchTerm}
                        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={20} />}
                        Analyze Niche
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {analysis ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-8 rounded-3xl border flex flex-col items-center text-center ${getScoreColor(analysis.opportunityScore)} animate-in slide-in-from-left duration-500`}>
                            <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-4">
                                <Target size={32} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-1">Opportunity Score</h3>
                            <div className="text-6xl font-black mb-2">{analysis.opportunityScore}</div>
                            <p className="text-xs font-medium max-w-[200px]">
                                {analysis.opportunityScore > 70 ? 'Excellent niche with high profit potential and manageable competition.' :
                                    analysis.opportunityScore > 40 ? 'Moderate potential. Requires unique differentiation to succeed.' :
                                        'Highly difficult niche. Saturated with established competitors.'}
                            </p>
                        </div>
                        <div className={`p-8 rounded-3xl border flex flex-col items-center text-center ${getScoreColor(100 - analysis.saturationScore)} animate-in slide-in-from-right duration-500`}>
                            <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-4">
                                <Users size={32} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-1">Market Saturation</h3>
                            <div className="text-6xl font-black mb-2">{analysis.saturationScore}%</div>
                            <p className="text-xs font-medium max-w-[200px]">
                                {analysis.saturationScore < 30 ? 'Open market. Very few brands dominate the space.' :
                                    analysis.saturationScore < 60 ? 'Competitive. Some brands have a strong foothold.' :
                                        'Heavily saturated. Dominated by a few giant players.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Avg Rating', value: `${analysis.avgRating.toFixed(1)} ★`, icon: TrendingUp },
                            { label: 'Avg Reviews', value: analysis.avgReviews.toLocaleString(), icon: BarChart3 },
                            { label: 'Avg Price', value: `$${analysis.avgPrice.toFixed(2)}`, icon: Target },
                            { label: 'Top Brands', value: analysis.dominantBrands.length, icon: ShieldAlert }
                        ].map((metric, idx) => (
                            <div key={idx} className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{metric.label}</span>
                                <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <metric.icon size={16} className="text-brand-500" />
                                    {metric.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-green-500" /> Dominant Brands
                            </h4>
                            <div className="space-y-3">
                                {analysis.dominantBrands.map((brand, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{brand}</span>
                                        <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">Top Competitor</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 size={18} className="text-brand-500" /> Revenue Leaders
                            </h4>
                            <div className="space-y-3">
                                {analysis.topProducts.map((prod, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 line-clamp-1 max-w-[200px]">{prod.title}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">{prod.asin}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-green-600 block">{prod.sales.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400">units/mo</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-dark-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-dark-700 text-center animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-dark-700 rounded-full flex items-center justify-center mb-6">
                            <TrendingUp className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to explore?</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            Input a niche keyword above to generate a deep opportunity analysis including saturation scores and revenue leaders.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-400 text-sm font-medium border border-brand-100 dark:border-brand-700/50">
                            <Layers size={16} />
                            Try searching for "Biodegradable Yoga Mats"
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
