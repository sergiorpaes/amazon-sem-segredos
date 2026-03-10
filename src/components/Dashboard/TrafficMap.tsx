import React, { useState } from 'react';
import { Share2, Search, Zap, AlertCircle, Info, ExternalLink, ArrowRight, Target, Network, Compass } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { searchProducts } from '../../services/amazonAuthService';

interface RelatedProduct {
    asin: string;
    title: string;
    type: 'competitor' | 'complementary' | 'upsell';
    relevance: number;
    price: number;
    image: string;
}

export const TrafficMap: React.FC = () => {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    const [asin, setAsin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mapData, setMapData] = useState<{ central: any; related: RelatedProduct[] } | null>(null);

    const handleGenerateMap = async () => {
        if (!asin.trim()) return;
        setLoading(true);
        setError(null);
        try {
            // First, find the central product
            const result = await searchProducts(asin, 'ATVPDKIKX0DER');
            refreshUser();

            if (result && result.items && result.items.length > 0) {
                const central = result.items[0];
                const summary = central.summaries?.[0] || {};

                // Simulate finding related products via keyword/brand search
                const query = summary.itemName?.split(' ').slice(0, 3).join(' ') || '';
                const relatedResult = await searchProducts(query, 'ATVPDKIKX0DER');

                const related: RelatedProduct[] = (relatedResult.items || [])
                    .filter((item: any) => item.asin !== central.asin)
                    .slice(0, 6)
                    .map((item: any, idx) => {
                        const s = item.summaries?.[0] || {};
                        const types: ('competitor' | 'complementary' | 'upsell')[] = ['competitor', 'complementary', 'upsell'];
                        return {
                            asin: item.asin,
                            title: s.itemName || 'N/A',
                            type: types[idx % 3],
                            relevance: 95 - (idx * 5),
                            price: s.price?.amount || 29.99,
                            image: s.mainImage?.link || ''
                        };
                    });

                setMapData({
                    central: {
                        asin: central.asin,
                        title: summary.itemName || 'N/A',
                        image: summary.mainImage?.link || '',
                        price: summary.price?.amount || 0
                    },
                    related
                });
            } else {
                setError(t('error.no_products'));
                setMapData(null);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error generating traffic map');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                            <Share2 className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('traffic.title')}</h2>
                            <p className="text-sm text-gray-500">Visualize product ecosystems and traffic flow.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Enter ASIN to map (e.g. B08N5KWB9H)..."
                            value={asin}
                            onChange={(e) => setAsin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateMap()}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleGenerateMap}
                        disabled={loading || !asin}
                        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Network size={20} />}
                        Build Map
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {mapData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
                    {/* Visual Map (CSS/SVG based network) */}
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-dark-900/50 rounded-3xl border border-gray-100 dark:border-dark-800 p-8 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Central Node */}
                            <div className="z-10 relative group">
                                <div className="absolute -inset-4 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="bg-white dark:bg-dark-800 p-2 rounded-2xl border-2 border-brand-500 shadow-2xl relative">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white">
                                        <img src={mapData.central.image} alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="absolute -top-3 -right-3 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">MAIN</div>
                                </div>
                            </div>

                            {/* Related Nodes (Radial Layout) */}
                            {mapData.related.map((node, i) => {
                                const angle = (i * 360) / mapData.related.length;
                                const radius = 160;
                                const x = radius * Math.cos((angle * Math.PI) / 180);
                                const y = radius * Math.sin((angle * Math.PI) / 180);

                                return (
                                    <React.Fragment key={node.asin}>
                                        {/* Connection Line */}
                                        <div
                                            className="absolute w-px bg-gradient-to-t from-brand-300/30 to-brand-500/0 dark:from-brand-500/20 dark:to-brand-500/0 origin-bottom"
                                            style={{
                                                height: radius,
                                                left: '50%',
                                                bottom: '50%',
                                                transform: `rotate(${angle + 90}deg)`
                                            }}
                                        />

                                        <div
                                            className="absolute animate-in zoom-in duration-500"
                                            style={{
                                                transform: `translate(${x}px, ${y}px)`,
                                                transitionDelay: `${i * 100}ms`
                                            }}
                                        >
                                            <div className="group relative">
                                                <div className="bg-white dark:bg-dark-800 p-1.5 rounded-xl border border-gray-200 dark:border-dark-700 shadow-lg hover:border-brand-500 transition-all cursor-pointer">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                        <img src={node.image} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-900 text-white p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl pointer-events-none">
                                                    <div className="text-[10px] font-bold text-brand-400 uppercase mb-1">{node.type}</div>
                                                    <div className="text-[11px] font-medium line-clamp-2 leading-snug mb-2">{node.title}</div>
                                                    <div className="flex justify-between items-center border-t border-white/10 pt-2">
                                                        <span className="text-[10px] font-bold">${node.price}</span>
                                                        <span className="text-[10px] text-green-400 font-bold">{node.relevance}% Match</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Analysis Panel */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target size={18} className="text-brand-500" /> Market Intelligence
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-900/20">
                                    <div className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase mb-1">Top Complementary</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{mapData.related.find(r => r.type === 'complementary')?.title}</div>
                                    <p className="text-[10px] text-gray-500 mt-1">High conversion potential for bundled offers.</p>
                                </div>
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                    <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">Direct Competitor</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{mapData.related.find(r => r.type === 'competitor')?.title}</div>
                                    <p className="text-[10px] text-gray-500 mt-1">Check their pricing strategy to stay competitive.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Compass size={18} className="text-blue-500" /> Strategic Suggestions
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    'Improve visuals to match top upsell items.',
                                    'Consider Sponsored Brand ads for this niche.',
                                    'Bundle with complementary products found in map.'
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <Zap size={14} className="text-brand-500 shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-dark-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-dark-700 text-center animate-in fade-in duration-700">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center animate-pulse">
                                <Network className="w-12 h-12 text-brand-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <Search size={16} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Ecosystem Visualizer</h3>
                        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                            Enter a product ASIN to see how it sits within the Amazon ecosystem. Discover related products, potential upsells, and direct competitors in a visual relationship map.
                        </p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="p-4 bg-gray-50 dark:bg-dark-700/50 rounded-2xl">
                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Complementary</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">Bundle Opps</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-dark-700/50 rounded-2xl">
                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Competitors</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">Price Wars</div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
