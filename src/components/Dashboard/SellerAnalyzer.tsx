import React, { useState } from 'react';
import { Store, Search, Shield, Package, ShoppingBag, Info, AlertCircle, TrendingUp, PackageOpen, LayoutGrid, BarChart3, PieChart } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { searchProducts, getBatchOffers } from '../../services/amazonAuthService';

interface SellerProduct {
    id: string;
    title: string;
    asin: string;
    brand: string;
    price: number;
    sales: number;
    revenue: number;
    bsr: number;
    category: string;
    image: string;
}

interface SellerStats {
    totalProducts: number;
    estimatedMonthlyRevenue: number;
    estimatedMonthlySales: number;
    topBrands: { name: string; count: number; revenue: number }[];
    mainCategory: string;
    avgPrice: number;
}

export const SellerAnalyzer: React.FC = () => {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    const [sellerId, setSellerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<SellerProduct[]>([]);
    const [stats, setStats] = useState<SellerStats | null>(null);

    const handleAnalyze = async () => {
        if (!sellerId.trim()) return;
        setLoading(true);
        setError(null);
        try {
            // SP-API search by Seller ID often works best using the ID as a keyword 
            // and then checking results. Some custom proxy logic might be needed for perfect filtering.
            const result = await searchProducts(sellerId, 'ATVPDKIKX0DER'); // Default to US for now
            refreshUser();

            if (result && result.items && result.items.length > 0) {
                const asins = result.items.map((i: any) => i.asin);
                const batchPricing = await getBatchOffers(asins, 'ATVPDKIKX0DER') as Record<string, any>;

                const mappedProducts: SellerProduct[] = result.items.map((item: any) => {
                    const pricing = batchPricing[item.asin] || {};
                    const summary = item.summaries?.[0] || {};
                    const price = pricing.price || summary.price?.amount || 0;
                    const sales = item.estimated_sales || 0;
                    const fbaFees = item.fba_fees || 0;
                    const rev = sales * (price - fbaFees);

                    return {
                        id: item.asin,
                        title: summary.itemName || 'N/A',
                        asin: item.asin,
                        brand: summary.brand || 'N/A',
                        price: price,
                        sales: sales,
                        revenue: rev > 0 ? rev : 0,
                        bsr: item.salesRanks?.[0]?.rank || 0,
                        category: summary.websiteDisplayGroupName || 'General',
                        image: summary.mainImage?.link || ''
                    };
                });

                // Compute Stats
                const brandMap: Record<string, { count: number; revenue: number }> = {};
                const catMap: Record<string, number> = {};
                let totalRev = 0;
                let totalSales = 0;
                let totalPrice = 0;

                mappedProducts.forEach(p => {
                    totalRev += p.revenue;
                    totalSales += p.sales;
                    totalPrice += p.price;

                    brandMap[p.brand] = {
                        count: (brandMap[p.brand]?.count || 0) + 1,
                        revenue: (brandMap[p.brand]?.revenue || 0) + p.revenue
                    };

                    catMap[p.category] = (catMap[p.category] || 0) + 1;
                });

                const topBrands = Object.entries(brandMap)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5);

                let mainCat = 'General';
                let maxCatCount = 0;
                Object.entries(catMap).forEach(([cat, count]) => {
                    if (count > maxCatCount) {
                        maxCatCount = count;
                        mainCat = cat;
                    }
                });

                setStats({
                    totalProducts: mappedProducts.length,
                    estimatedMonthlyRevenue: totalRev,
                    estimatedMonthlySales: totalSales,
                    topBrands,
                    mainCategory: mainCat,
                    avgPrice: mappedProducts.length > 0 ? totalPrice / mappedProducts.length : 0
                });

                setProducts(mappedProducts);
            } else {
                setProducts([]);
                setStats(null);
                setError(t('error.no_products'));
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error analyzing seller');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Header */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:shadow-md">
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
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Insert Seller ID (e.g. A3ABCDEFGH1234)..."
                            value={sellerId}
                            onChange={(e) => setSellerId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !sellerId}
                        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <TrendingUp size={20} />}
                        Analyze Store
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in zoom-in border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:translate-y-[-2px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600"><ShoppingBag size={18} /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Mensal</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(stats.estimatedMonthlyRevenue)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:translate-y-[-2px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600"><Package size={18} /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Volume Vendas</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.estimatedMonthlySales.toLocaleString()} <span className="text-sm font-normal text-gray-400">unid.</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:translate-y-[-2px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600"><LayoutGrid size={18} /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total SKUs</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</div>
                    </div>
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:translate-y-[-2px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600"><BarChart3 size={18} /></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Principais Marcas</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {stats.topBrands.slice(0, 2).map(b => (
                                <span key={b.name} className="px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                    {b.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {products.length > 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-50 dark:border-dark-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Catálogo do Vendedor</h3>
                        <span className="text-xs text-gray-400 italic">Análise baseada nos produtos mais relevantes encontrados.</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-dark-700/50 text-[10px] uppercase font-bold text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">ASIN/Marca</th>
                                    <th className="px-4 py-3">BSR</th>
                                    <th className="px-4 py-3 text-right">Preço</th>
                                    <th className="px-4 py-3 text-right">Vendas</th>
                                    <th className="px-4 py-3 text-right">Faturamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded border border-gray-100 dark:border-dark-600 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                                                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain" /> : <PackageOpen size={20} className="text-gray-200" />}
                                                </div>
                                                <div className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 max-w-[250px]">{p.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-brand-600 mb-0.5">{p.asin}</span>
                                                <span className="text-[10px] text-gray-400">{p.brand}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">#{p.bsr.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">
                                            ${p.price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-xs font-bold text-green-600">{p.sales.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">
                                            ${p.revenue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!stats && !loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Shield, title: 'Store Health', desc: 'Monitor the evolution of reviews and feedback of the store.' },
                        { icon: Package, title: 'Brand Distribution', desc: 'See which brands the competitor is liquidating or holding.' },
                        { icon: ShoppingBag, title: 'Bestseller Capture', desc: 'Identify the most profitable products in the competitor\'s catalog.' }
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:shadow-md">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-dark-700 rounded-lg flex items-center justify-center mb-4">
                                <feature.icon className="w-5 h-5 text-gray-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h4>
                            <p className="text-sm text-gray-500">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
