import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Trophy, TrendingUp, AlertCircle, PackageOpen, ChevronDown, Check, Coins } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { getTopBrands, searchProducts, getBatchOffers, SUPPORTED_MARKETPLACES } from '../../services/amazonAuthService';
import { useSettings } from '../../contexts/SettingsContext';

interface BrandDisplay {
    brand: string;
    productCount: number;
    estRevenue: number;
    estSales: number;
    avgPrice: number;
    avgActiveSellers: number;
    totalFbaFees: number;
    topCategory: string;
}

export const BrandFinder: React.FC = () => {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    const { enabledMarketplaces } = useSettings();

    const availableMarketplaces = SUPPORTED_MARKETPLACES.filter(m => enabledMarketplaces.includes(m.id));
    const defaultMarketplace = availableMarketplaces.find(m => m.id === 'ATVPDKIKX0DER')?.id || availableMarketplaces.find(m => m.id === 'A2Q3Y263D00KWC')?.id || availableMarketplaces[0]?.id || 'ATVPDKIKX0DER';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMarketplace, setSelectedMarketplace] = useState<string>(defaultMarketplace);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brands, setBrands] = useState<BrandDisplay[]>([]);

    const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
    const marketplaceRef = useRef<HTMLDivElement>(null);

    type SortConfig = { key: keyof BrandDisplay; direction: 'asc' | 'desc' } | null;
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'estRevenue', direction: 'desc' });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (marketplaceRef.current && !marketplaceRef.current.contains(event.target as Node)) {
                setIsMarketplaceOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Initial Load - Fetch Top Brands automatically
    useEffect(() => {
        handleSearch(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const processProductsIntoBrands = (items: any[], batchPricing: any) => {
        const brandMap = new Map<string, any[]>();

        items.forEach(item => {
            const summary = item.summaries && item.summaries.length > 0 ? item.summaries[0] : null;
            let brandName = summary?.brand || summary?.brandName || 'Unknown';
            if (!brandName || brandName === 'Unknown') return; // Skip items without brand

            // Ensure case consistency
            brandName = brandName.trim();

            const pricing = batchPricing[item.asin] || {};
            const price = pricing.price > 0 ? pricing.price : (summary?.price?.amount || 0);
            const estSales = item.estimated_sales || 0;
            const fbaFees = item.fba_fees || 0;
            const activeSellers = pricing.activeSellers || item.active_sellers || 1;
            const category = summary?.websiteDisplayGroupName || 'General';

            if (!brandMap.has(brandName)) {
                brandMap.set(brandName, []);
            }
            brandMap.get(brandName)?.push({
                price,
                estSales,
                fbaFees,
                activeSellers,
                category
            });
        });

        const processedBrands: BrandDisplay[] = [];
        brandMap.forEach((productList, brandName) => {
            let totalSales = 0;
            let totalRevenue = 0;
            let totalPrice = 0;
            let totalActiveSellers = 0;
            let totalFbaFees = 0;

            // Calculate top category by occurrences
            const catCount: Record<string, number> = {};

            productList.forEach(p => {
                totalSales += p.estSales;
                const revenue = p.estSales * (p.price - p.fbaFees);
                totalRevenue += (revenue > 0 ? revenue : 0);
                totalPrice += p.price;
                totalActiveSellers += p.activeSellers;
                totalFbaFees += (p.fbaFees * p.estSales);

                catCount[p.category] = (catCount[p.category] || 0) + 1;
            });

            const productCount = productList.length;
            let topCategory = 'General';
            let maxCat = 0;
            for (const cat in catCount) {
                if (catCount[cat] > maxCat) {
                    maxCat = catCount[cat];
                    topCategory = cat;
                }
            }

            processedBrands.push({
                brand: brandName,
                productCount,
                estSales: totalSales,
                estRevenue: totalRevenue,
                avgPrice: productCount > 0 ? (totalPrice / productCount) : 0,
                avgActiveSellers: productCount > 0 ? (totalActiveSellers / productCount) : 0,
                totalFbaFees,
                topCategory
            });
        });

        return processedBrands;
    };

    const handleSearch = async (isInitialLoad: boolean = false) => {
        setIsSearching(true);
        setError(null);
        try {
            let result;
            if (isInitialLoad || !searchTerm) {
                result = await getTopBrands(selectedMarketplace);
            } else {
                result = await searchProducts(searchTerm, selectedMarketplace);
            }

            if (!isInitialLoad) refreshUser();

            if (result && result.items && result.items.length > 0) {

                const asins = result.items.map((i: any) => i.asin);
                const batchResults = await getBatchOffers(asins, selectedMarketplace);

                const computedBrands = processProductsIntoBrands(result.items, batchResults);

                if (computedBrands.length === 0) {
                    setError(t('error.no_products'));
                }
                setBrands(computedBrands);
            } else {
                setBrands([]);
                if (!isInitialLoad) setError(t('error.no_products'));
            }
        } catch (err: any) {
            console.error(err);
            let errorMessage = err.message || 'Error';
            if (errorMessage === 'Insufficient credits' || errorMessage.includes('Insufficient active credits in ledger')) {
                errorMessage = t('error.insufficient_credits');
            } else if (errorMessage === 'Internal Server Error' || errorMessage.includes('500')) {
                errorMessage = t('error.internal_server');
            }
            setError(errorMessage);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSort = (key: keyof BrandDisplay) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBrands = useMemo(() => {
        let sortableItems = [...brands];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [brands, sortConfig]);

    const selectedFlag = availableMarketplaces.find(m => m.id === selectedMarketplace)?.flag;
    const selectedCode = availableMarketplaces.find(m => m.id === selectedMarketplace)?.code;

    return (
        <div className="space-y-4 h-full bg-gray-50 dark:bg-dark-900 transition-colors duration-200">

            {/* Search Header */}
            <div className="flex flex-col gap-6 items-center bg-white dark:bg-dark-800 p-5 md:p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:shadow-md mx-2 sm:mx-0">
                <div className="w-full max-w-4xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white"><Trophy className="text-brand-500" /> {t('module.brand_finder')}</h2>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-500" />
                            <input
                                type="text"
                                placeholder={t('search.placeholder') + " (ex: Apple, Samsung...)"}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-600 text-sm md:text-base shadow-inner transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
                            />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none" ref={marketplaceRef}>
                                <button
                                    onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
                                    className="flex justify-center items-center gap-2 w-full h-[54px] md:h-[58px] px-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-600 transition-all md:min-w-[120px]"
                                >
                                    <span className="text-xl">{selectedFlag}</span>
                                    <span className="flex-1 md:flex-none text-left">{selectedCode}</span>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMarketplaceOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMarketplaceOpen && (
                                    <div className="absolute top-full right-0 mt-3 w-full md:w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-700 z-50 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                        <div className="p-2 grid gap-1">
                                            {availableMarketplaces.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setSelectedMarketplace(m.id);
                                                        setIsMarketplaceOpen(false);
                                                        // Automatically fetch top brands for new marketplace
                                                        setSearchTerm('');
                                                        handleSearch(true);
                                                    }}
                                                    className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                            ${selectedMarketplace === m.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' : 'hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300'}
                          `}
                                                >
                                                    <span className="text-xl">{m.flag}</span>
                                                    <span className="flex-1 text-left truncate">{m.name}</span>
                                                    {selectedMarketplace === m.id && <Check size={14} className="text-brand-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleSearch(false)}
                                disabled={isSearching}
                                className="bg-brand-600 flex-1 md:flex-none justify-center text-white px-6 md:px-10 h-[54px] md:h-[58px] rounded-2xl font-bold hover:bg-brand-700 transition-all text-sm md:text-base shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSearching ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span className="hidden sm:inline">{t('search.button')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in mx-2 sm:mx-0 border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden mx-2 sm:mx-0 transition-colors">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-700/50 border-b border-gray-100 dark:border-dark-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('brand')}>
                                    <div className="flex items-center gap-2">
                                        {t('pf.brand')}
                                        {sortConfig?.key === 'brand' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('topCategory')}>
                                    <div className="flex items-center gap-2">Categoria Principal</div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('estRevenue')}>
                                    <div className="flex items-center gap-2">
                                        {t('modal.est_revenue')}
                                        {sortConfig?.key === 'estRevenue' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('estSales')}>
                                    <div className="flex items-center gap-2">
                                        {t('modal.est_sales')}
                                        {sortConfig?.key === 'estSales' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('avgPrice')}>
                                    <div className="flex items-center gap-2">
                                        Preço Médio
                                        {sortConfig?.key === 'avgPrice' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('productCount')}>
                                    <div className="flex items-center gap-2">
                                        {t('common.product')}s
                                        {sortConfig?.key === 'productCount' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('totalFbaFees')}>
                                    <div className="flex items-center gap-2">
                                        Total FBA
                                        {sortConfig?.key === 'totalFbaFees' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('avgActiveSellers')}>
                                    <div className="flex items-center gap-2">
                                        Média Sellers
                                        {sortConfig?.key === 'avgActiveSellers' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                            {sortedBrands.map((brand, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-brand-900/10 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center text-gray-400">
                                                <Trophy size={16} />
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{brand.brand}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-xs">{brand.topCategory}</span>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(brand.estRevenue)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold text-sm">
                                            <TrendingUp size={14} />
                                            {brand.estSales.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(brand.avgPrice)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm font-medium">
                                            <PackageOpen size={14} />
                                            {brand.productCount}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-red-500 dark:text-red-400 font-medium">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(brand.totalFbaFees)}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        {brand.avgActiveSellers.toFixed(1)}
                                    </td>
                                </tr>
                            ))}

                            {!isSearching && brands.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-gray-400">
                                        <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                                        <span className="text-lg font-medium">Busque por marcas no topo</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
