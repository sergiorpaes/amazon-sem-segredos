import React, { useState, useMemo } from 'react';
import {
    DollarSign, Info, Download, BarChart3, TrendingUp,
    Wallet, Sparkles, Search, Package, Box, RefreshCw, X, ChevronDown, ChevronUp,
    Target, Lightbulb, Activity, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { jsPDF } from 'jspdf';
import { getRecommendations } from '../../lib/strategicRecommendations';
import { searchProducts, getItemOffers, SUPPORTED_MARKETPLACES } from '../../services/amazonAuthService';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ProductMetadata } from '../../types';
import { getSupplierLinks } from '../../lib/sourcingUtils';

export const ProfitCalculator: React.FC = () => {
    const { t, language } = useLanguage();
    const { enabledMarketplaces } = useSettings();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [marketplace, setMarketplace] = useState('A1RKKUPIHCS9HS'); // ES Default
    const [product, setProduct] = useState<ProductMetadata | null>(null);
    const [fbaFeesExpanded, setFbaFeesExpanded] = useState(true);
    const [fbmFeesExpanded, setFbmFeesExpanded] = useState(true);
    const [fbaStorageExpanded, setFbaStorageExpanded] = useState(true);
    const [fbmStorageExpanded, setFbmStorageExpanded] = useState(true);
    const [fbaStrategyExpanded, setFbaStrategyExpanded] = useState(true);
    const [fbmStrategyExpanded, setFbmStrategyExpanded] = useState(true);

    // Seasonal State
    const [season, setSeason] = useState<'jan-sep' | 'oct-dec'>('jan-sep');

    // --- Common Inputs ---
    const [cogs, setCogs] = useState<number>(30.00);
    const [taxRate, setTaxRate] = useState<number>(21); // Default ES VAT
    const [batchSize, setBatchSize] = useState<number>(100);

    // FBA State
    const [fbaPrice, setFbaPrice] = useState<number>(100.00);
    const [fbaReferral, setFbaReferral] = useState<number>(15.00);
    const [fbaFixedClosing, setFbaFixedClosing] = useState<number>(0.00);
    const [fbaVariableClosing, setFbaVariableClosing] = useState<number>(0.00);
    const [fbaDigitalServices, setFbaDigitalServices] = useState<number>(0.30);
    const [fbaFulfilment, setFbaFulfilment] = useState<number>(5.50);

    // FBA Storage Detailed
    const [fbaMonthlyStoragePrice, setFbaMonthlyStoragePrice] = useState<number>(0.80);
    const [fbaAvgInventory, setFbaAvgInventory] = useState<number>(50);
    const [fbaEstSales, setFbaEstSales] = useState<number>(100);

    const [fbaMiscCost, setFbaMiscCost] = useState<number>(0.50);
    const [fbaAdsCost, setFbaAdsCost] = useState<number>(10.00); // Ads cost per unit

    // FBM State
    const [fbmPrice, setFbmPrice] = useState<number>(100.00);
    const [fbmShippingOut, setFbmShippingOut] = useState<number>(0); // Portes de envio
    const [fbmReferral, setFbmReferral] = useState<number>(15.00);
    const [fbmFixedClosing, setFbmFixedClosing] = useState<number>(0.00);
    const [fbmVariableClosing, setFbmVariableClosing] = useState<number>(0.00);
    const [fbmDigitalServices, setFbmDigitalServices] = useState<number>(0.30);
    const [fbmFulfilment, setFbmFulfilment] = useState<number>(4.50);

    // FBM Storage Detailed
    const [fbmMonthlyStoragePrice, setFbmMonthlyStoragePrice] = useState<number>(0);
    const [fbmAvgInventory, setFbmAvgInventory] = useState<number>(0);
    const [fbmEstSales, setFbmEstSales] = useState<number>(100);

    const [fbmMiscCost, setFbmMiscCost] = useState<number>(0.50);
    const [fbmAdsCost, setFbmAdsCost] = useState<number>(8.00); // Ads cost per unit

    // --- Calculations ---
    const calculateStorage = (monthlyRate: number, avgInv: number, estSales: number) => {
        if (!estSales || estSales === 0) return 0;
        return (monthlyRate * avgInv) / estSales;
    };

    const calculateTotalFees = (referral: number, fixed: number, variable: number, digital: number) => {
        return referral + fixed + variable + digital;
    };

    const fbaUnitStorage = calculateStorage(fbaMonthlyStoragePrice, fbaAvgInventory, fbaEstSales);
    const fbaTotalAmazonFees = calculateTotalFees(fbaReferral, fbaFixedClosing, fbaVariableClosing, fbaDigitalServices);

    const fbmUnitStorage = calculateStorage(fbmMonthlyStoragePrice, fbmAvgInventory, fbmEstSales);
    const fbmTotalAmazonFees = calculateTotalFees(fbmReferral, fbmFixedClosing, fbmVariableClosing, fbmDigitalServices);

    const calcResults = (price: number, shipping: number, fees: number, fulfilment: number, storage: number, misc: number, ads: number) => {
        const totalSales = price + shipping;
        const taxAmount = totalSales * (taxRate / 100);
        const totalExpenses = fees + fulfilment + storage + misc + cogs + taxAmount + ads;
        const netProfit = totalSales - totalExpenses;
        const netMargin = totalSales ? (netProfit / totalSales) * 100 : 0;
        const roi = cogs > 0 ? (netProfit / cogs) * 100 : 0;

        // Break-even logic (approximate including variable taxes and referral %)
        // referral_rate = referral / price
        const referralRate = price > 0 ? fees / price : 0.15;
        const taxRateNormalized = taxRate / 100;
        // Break-even Price: (Other Fixed Costs) / (1 - Variable Rates)
        // Fixed = fulfilment + storage + misc + cogs + ads
        const fixedCosts = fulfilment + storage + misc + cogs + ads;
        const breakEven = fixedCosts / (1 - (referralRate + taxRateNormalized));

        return { netProfit, netMargin, roi, totalExpenses, taxAmount, totalSales, breakEven };
    };

    const fbaResults = calcResults(fbaPrice, 0, fbaTotalAmazonFees, fbaFulfilment, fbaUnitStorage, fbaMiscCost, fbaAdsCost);
    const fbmResults = calcResults(fbmPrice, fbmShippingOut, fbmTotalAmazonFees, fbmFulfilment, fbmUnitStorage, fbmMiscCost, fbmAdsCost);

    const formatCurrency = (amount: number) => {
        const curr = product?.currency || (marketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR');
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: curr
        }).format(amount);
    };

    // Strategic Recommendations Memo
    const fbaRecommendations = useMemo(() => {
        const data = {
            productCost: cogs, taxRate, opExpenses: fbaMiscCost, adsCost: fbaAdsCost,
            amazonFees: fbaTotalAmazonFees + fbaFulfilment + fbaUnitStorage,
            netProfit: fbaResults.netProfit, netMargin: fbaResults.netMargin, roi: fbaResults.roi
        };
        return getRecommendations(product || { price: fbaPrice }, data, language);
    }, [cogs, taxRate, fbaMiscCost, fbaAdsCost, fbaTotalAmazonFees, fbaFulfilment, fbaUnitStorage, fbaResults, product, language]);

    const fbmRecommendations = useMemo(() => {
        const data = {
            productCost: cogs, taxRate, opExpenses: fbmMiscCost, adsCost: fbmAdsCost,
            amazonFees: fbmTotalAmazonFees + fbmFulfilment + fbmUnitStorage,
            netProfit: fbmResults.netProfit, netMargin: fbmResults.netMargin, roi: fbmResults.roi
        };
        return getRecommendations(product || { price: fbmPrice }, data, language);
    }, [cogs, taxRate, fbmMiscCost, fbmAdsCost, fbmTotalAmazonFees, fbmFulfilment, fbmUnitStorage, fbmResults, product, language]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim().toUpperCase();
        if (!query) return;

        // ASIN Validation: 10 chars, alphanumeric, usually starts with B
        const isAsin = /^(B\w{9}|\d{9}[0-9X])$/.test(query);

        if (!isAsin) {
            setError("Por favor, insira um ASIN válido (ex: B086PHS2V8). A calculadora aceita apenas ASINs.");
            return;
        }

        setIsSearching(true);
        setError(null);
        try {
            const data = await searchProducts(query, marketplace);
            if (data && data.items && data.items.length > 0) {
                const item = data.items[0];
                const summary = item.summaries?.[0];
                const attributes = item.attributes;
                const dims = attributes?.item_dimensions?.[0];
                const weight = attributes?.item_weight?.[0];
                const price = summary?.price?.amount || 0;

                setProduct({
                    id: item.asin,
                    title: summary?.itemName || 'Unknown Product',
                    image: item.images?.[0]?.images?.[0]?.link,
                    brand: summary?.brandName || summary?.brand,
                    category: summary?.websiteDisplayGroupName,
                    price: price,
                    currency: summary?.price?.currencyCode,
                    bsr: (data.items[0] as any)?.salesRanks?.[0]?.rank,
                    offers: (data.items[0] as any)?.activeSellers,
                    dimensions: dims ? { length: dims.length, width: dims.width, height: dims.height, unit: dims.unit } : undefined,
                    weight: weight ? { value: weight.value, unit: weight.unit } : undefined
                });

                if (price > 0) {
                    setFbaPrice(price);
                    setFbmPrice(price);
                    const estRef = price * 0.15;
                    setFbaReferral(estRef);
                    setFbmReferral(estRef);
                }

                // --- Background Pricing Fetch for accurate Real-time data ---
                getItemOffers(item.asin, marketplace).then(offers => {
                    if (offers && offers.price > 0) {
                        setFbaPrice(offers.price);
                        setFbmPrice(offers.price);
                        const newRef = offers.price * 0.15;
                        setFbaReferral(newRef);
                        setFbmReferral(newRef);
                        setProduct(prev => prev ? {
                            ...prev,
                            price: offers.price,
                            currency: offers.currency,
                            offers: offers.activeSellers
                        } : null);
                    }
                }).catch(err => console.error("Pricing fetch failed:", err));
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao buscar produto na Amazon.");
        } finally { setIsSearching(false); }
    };

    // UI Helpers
    const DataRow = ({ label, value, isBold = false, indent = false, colorClass = "" }: { label: string, value: string | React.ReactNode, isBold?: boolean, indent?: boolean, colorClass?: string }) => (
        <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-4' : ''}`}>
            <span className={`text-sm ${isBold ? 'font-bold' : ''} ${colorClass || 'text-gray-600 dark:text-gray-400'}`}>
                {label}
            </span>
            <span className={`text-sm ${isBold ? 'font-bold' : ''} ${colorClass || 'text-gray-700 dark:text-gray-300'}`}>
                {value}
            </span>
        </div>
    );

    const InputRow = ({ label, value, onChange, prefix, suffix, help }: { label: string, value: number, onChange: (val: number) => void, prefix?: string, suffix?: string, help?: string }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                {label}
                {help && <div className="group relative"><Info className="w-3 h-3 text-gray-300 cursor-help" /><div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded hidden group-hover:block z-50">{help}</div></div>}
            </span>
            <div className="flex items-center gap-1">
                {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-20 text-right bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#007185]"
                />
                {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Search Header */}
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Insira o ASIN do produto (ex: B086PHS2V8)"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white text-base shadow-inner transition-all text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none max-w-[150px] shadow-inner focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all cursor-pointer">
                        {SUPPORTED_MARKETPLACES.filter(m => enabledMarketplaces.includes(m.id)).map(m => (
                            <option key={m.id} value={m.id}>{m.flag} {m.code}</option>
                        ))}
                    </select>
                    <button type="submit" disabled={isSearching} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isSearching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                        {t('sim.search_button')}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium animate-in fade-in flex items-start gap-3">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p>{error}</p>
                            {error.includes('403') && (
                                <p className="mt-1 text-xs opacity-80">
                                    Verifique se as suas credenciais da API na aba "Configurações" estão corretas e se têm permissão para a região selecionada.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {product ? (
                    <div className="mt-8 flex gap-6 items-start border-t border-gray-100 pt-8 animate-in fade-in duration-500">
                        {product.image && <div className="w-24 h-24 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-2 shadow-sm"><img src={product.image} className="w-full h-full object-contain" alt="" /></div>}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">ASIN</span> <span className="font-mono text-sm font-medium text-gray-900 bg-gray-50 px-2 py-0.5 rounded w-fit select-all">{product.id}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Weight</span> <span className="font-bold text-gray-900">{product.weight ? `${product.weight.value} ${product.weight.unit}` : '-'}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">BSR (Sales Rank)</span> <span className="font-bold text-gray-900">#{product.bsr?.toLocaleString() || '-'}</span></div>
                                <div className="flex flex-col items-start gap-2 lg:items-end justify-center">
                                    <div className="flex gap-2">
                                        {Object.entries(getSupplierLinks(product.title, product.brand)).map(([key, url]) => (
                                            <a
                                                key={key}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 transition-colors border border-gray-200"
                                            >
                                                <Search className="w-3 h-3" />
                                                {t(`sourcing.${key}`)}
                                            </a>
                                        ))}
                                    </div>
                                    <button onClick={() => setProduct(null)} className="text-brand-600 hover:text-brand-800 hover:underline font-bold text-xs mt-1 transition-colors">{t('sim.search_another')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Initial State or Empty State
                    <div className="mt-8 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="w-8 h-8 text-brand-500" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Simule a Rentabilidade Real</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm">Cole um ASIN Amazon acima para analisar todas as taxas FBA, Margem Líquida e ROI em segundos.</p>
                    </div>
                )}
            </div>

            {/* Global Settings Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex flex-wrap gap-6 items-center justify-center shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{t('sim.cogs')}</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-900/50 rounded px-2 py-1">
                        <span className="text-xs text-gray-400 text-emerald-600">€</span>
                        <input type="number" value={cogs} onChange={(e) => setCogs(Number(e.target.value))} className="w-16 bg-transparent outline-none text-sm font-bold text-center" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{t('sim.vat')} (%)</span>
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-14 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-900/50 rounded px-2 py-1 text-sm font-bold text-center" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Lote</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-900/50 rounded px-2 py-1">
                        <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="w-14 bg-transparent outline-none text-sm font-bold text-center" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Unid.</span>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LOGÍSTICA DA AMAZON (FBA) */}
                <div className="bg-white dark:bg-dark-900 rounded-sm border border-[#d5dbdb] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] flex justify-between items-center bg-[#f0f2f2]">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-200 flex items-center gap-2">
                            <Box className="w-4 h-4 text-[#007185]" />
                            Logística da Amazon (FBA)
                        </h4>
                        <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col space-y-4">
                        <InputRow label={t('sim.item_price')} value={fbaPrice} onChange={setFbaPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbaFeesExpanded(!fbaFeesExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.amazon_fees')} {formatCurrency(fbaTotalAmazonFees)}
                                    {fbaFeesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbaFeesExpanded && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1">
                                    <InputRow label={t('sim.referral_fee')} value={fbaReferral} onChange={setFbaReferral} />
                                    <InputRow label={t('sim.fixed_closing')} value={fbaFixedClosing} onChange={setFbaFixedClosing} />
                                    <InputRow label={t('sim.variable_closing')} value={fbaVariableClosing} onChange={setFbaVariableClosing} />
                                    <InputRow label={t('sim.digital_services')} value={fbaDigitalServices} onChange={setFbaDigitalServices} />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <DataRow label={`${t('sim.fulfilment_cost')} ${formatCurrency(fbaFulfilment)}`} value={<ChevronDown className="w-3 h-3" />} />
                        </div>

                        {/* Storage Section */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbaStorageExpanded(!fbaStorageExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.storage_cost')} {formatCurrency(fbaUnitStorage)}
                                    {fbaStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbaStorageExpanded && (
                                <div className="space-y-3 animate-in slide-in-from-top-1">
                                    <div className="flex rounded overflow-hidden border border-[#d5dbdb] text-[10px] font-bold">
                                        <button onClick={() => setSeason('jan-sep')} className={`flex-1 py-1.5 transition-colors ${season === 'jan-sep' ? 'bg-[#007185] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('sim.jan_sep')}</button>
                                        <button onClick={() => setSeason('oct-dec')} className={`flex-1 py-1.5 transition-colors ${season === 'oct-dec' ? 'bg-[#007185] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('sim.oct_dec')}</button>
                                    </div>
                                    <InputRow label={t('sim.storage_per_unit')} value={fbaMonthlyStoragePrice} onChange={setFbaMonthlyStoragePrice} />
                                    <InputRow label={t('sim.avg_inventory')} value={fbaAvgInventory} onChange={setFbaAvgInventory} />
                                    <InputRow label={t('sim.est_sales_month')} value={fbaEstSales} onChange={setFbaEstSales} />
                                    <DataRow label={t('sim.storage_per_sold')} value={formatCurrency(fbaUnitStorage)} isBold />
                                </div>
                            )}
                        </div>

                        {/* ADVANCED STRATEGY SECTION (FBA) */}
                        <div className="border-t border-emerald-100 bg-emerald-50/20 dark:bg-emerald-900/10 p-4 -mx-5 space-y-4">
                            <button onClick={() => setFbaStrategyExpanded(!fbaStrategyExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-emerald-800 dark:text-emerald-400">
                                <span className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    {t('sim.ads_impact')} & Estratégia
                                    {fbaStrategyExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>

                            {fbaStrategyExpanded && (
                                <div className="space-y-4 animate-in slide-in-from-top-1">
                                    <InputRow
                                        label={t('sim.ads_cost_unit')}
                                        value={fbaAdsCost}
                                        onChange={setFbaAdsCost}
                                        prefix={product?.currency === 'BRL' ? 'R$' : '€'}
                                        help="Custo médio de publicidade gasto para vender uma unidade. Impacta diretamente sua margem líquida."
                                    />

                                    <div className="bg-white dark:bg-dark-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                        <DataRow label={t('sim.break_even')} value={formatCurrency(fbaResults.breakEven)} isBold colorClass="text-emerald-700" />
                                        <p className="text-[10px] text-emerald-600/70 mt-1 italic">Preço mínimo para não ter prejuízo considerando todos os custos atuais.</p>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-1.5 mb-2 text-amber-700 dark:text-amber-400">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('sim.ai_advice')}</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {fbaRecommendations.slice(0, 2).map((rec, i) => (
                                                <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight flex gap-2">
                                                    <span className="text-amber-400">•</span> {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spacer to push result to bottom */}
                        <div className="flex-1 min-h-[1.5rem]" />

                        <div className="border-t border-[#d5dbdb] dashed pt-4 space-y-2">
                            <InputRow label={t('sim.misc_cost')} value={fbaMiscCost} onChange={setFbaMiscCost} />
                            <DataRow label="IVA / Impostos" value={formatCurrency(fbaResults.taxAmount)} />
                        </div>
                    </div>

                    {/* FBA Results Overlay Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 p-5 mt-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custo/Unid.</span>
                                <span className="font-black text-gray-900 text-sm">{formatCurrency(fbaResults.totalExpenses)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lote ({batchSize})</span>
                                <span className="font-black text-gray-900 text-sm">{formatCurrency(fbaResults.netProfit * batchSize)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lucro Líquido</span>
                                <span className={`font-black text-lg leading-none ${fbaResults.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(fbaResults.netProfit)}</span>
                            </div>
                            <div className={`flex flex-col items-center justify-center p-2 rounded-xl border shadow-sm ${fbaResults.netMargin >= 15 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : (fbaResults.netMargin > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800')}`}>
                                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Margem / ROI</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-lg leading-none">{fbaResults.netMargin.toFixed(1)}%</span>
                                    <span className="text-[10px] font-bold opacity-80">/ {fbaResults.roi.toFixed(0)}% ROI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* O SEU TIPO DE LOGÍSTICA (FBM) */}
                <div className="bg-white dark:bg-dark-900 rounded-sm border border-[#d5dbdb] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] flex justify-between items-center bg-[#f0f2f2]">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-200 flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#007185]" />
                            Logística do Vendedor (FBM)
                        </h4>
                        <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputRow label={t('sim.item_price')} value={fbmPrice} onChange={setFbmPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <InputRow label={t('sim.shipping_out')} value={fbmShippingOut} onChange={setFbmShippingOut} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded border border-dashed border-gray-200 flex justify-between">
                            <span className="text-sm font-bold text-gray-600">{t('sim.total_sales_price')}</span>
                            <span className="text-sm font-black text-[#007185]">{formatCurrency(fbmResults.totalSales)}</span>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbmFeesExpanded(!fbmFeesExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.amazon_fees')} {formatCurrency(fbmTotalAmazonFees)}
                                    {fbmFeesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbmFeesExpanded && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1">
                                    <InputRow label={t('sim.referral_fee')} value={fbmReferral} onChange={setFbmReferral} />
                                    <InputRow label={t('sim.fixed_closing')} value={fbmFixedClosing} onChange={setFbmFixedClosing} />
                                    <InputRow label={t('sim.variable_closing')} value={fbmVariableClosing} onChange={setFbmVariableClosing} />
                                    <InputRow label={t('sim.digital_services')} value={fbmDigitalServices} onChange={setFbmDigitalServices} />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <InputRow label={t('sim.fulfilment_cost')} value={fbmFulfilment} onChange={setFbmFulfilment} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <button className="text-[#007185] text-[10px] hover:underline flex items-center gap-1 mb-2">Editar discriminação dos custos <ChevronDown className="w-2.5 h-2.5" /></button>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbmStorageExpanded(!fbmStorageExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.storage_cost')} {formatCurrency(fbmUnitStorage)}
                                    {fbmStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbmStorageExpanded && (
                                <div className="space-y-2 animate-in slide-in-from-top-1">
                                    <p className="text-[11px] text-[#c45500] font-bold">Insira os seus custos de armazenamento</p>
                                    <InputRow label={t('sim.storage_per_unit')} value={fbmMonthlyStoragePrice} onChange={setFbmMonthlyStoragePrice} />
                                    <InputRow label={t('sim.avg_inventory')} value={fbmAvgInventory} onChange={setFbmAvgInventory} />
                                    <DataRow label={t('sim.storage_per_sold')} value={formatCurrency(fbmUnitStorage)} isBold />
                                </div>
                            )}
                        </div>

                        {/* ADVANCED STRATEGY SECTION (FBM) */}
                        <div className="border-t border-emerald-100 bg-emerald-50/20 dark:bg-emerald-900/10 p-4 -mx-5 space-y-4">
                            <button onClick={() => setFbmStrategyExpanded(!fbmStrategyExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-emerald-800 dark:text-emerald-400">
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    {t('sim.ads_impact')} & Break-even
                                    {fbmStrategyExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>

                            {fbmStrategyExpanded && (
                                <div className="space-y-4 animate-in slide-in-from-top-1">
                                    <InputRow label={t('sim.ads_cost_unit')} value={fbmAdsCost} onChange={setFbmAdsCost} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />

                                    <div className="bg-white dark:bg-dark-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                        <DataRow label={t('sim.break_even')} value={formatCurrency(fbmResults.breakEven)} isBold colorClass="text-emerald-700" />
                                        <p className="text-[10px] text-emerald-600/70 mt-1 italic">Considerando seus custos de logística própria e frete de envio.</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-1.5 mb-2 text-blue-700 dark:text-blue-400">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Estratégia FBM</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {fbmRecommendations.slice(0, 2).map((rec, i) => (
                                                <li key={i} className="text-[11px] text-blue-800 dark:text-blue-300 leading-tight flex gap-2">
                                                    <span className="text-blue-400">•</span> {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spacer to push result to bottom */}
                        <div className="flex-1 min-h-[1.5rem]" />

                        <div className="border-t border-[#d5dbdb] dashed pt-4">
                            <InputRow label={t('sim.misc_cost')} value={fbmMiscCost} onChange={setFbmMiscCost} />
                            <DataRow label="IVA / Impostos" value={formatCurrency(fbmResults.taxAmount)} />
                        </div>
                    </div>

                    {/* FBM Results Footer Results */}
                    <div className="bg-gray-50 border-t border-gray-100 p-5 mt-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custo/Unid.</span>
                                <span className="font-black text-gray-900 text-sm">{formatCurrency(fbmResults.totalExpenses)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lote ({batchSize})</span>
                                <span className="font-black text-gray-900 text-sm">{formatCurrency(fbmResults.netProfit * batchSize)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lucro Líquido</span>
                                <span className={`font-black text-lg leading-none ${fbmResults.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(fbmResults.netProfit)}</span>
                            </div>
                            <div className={`flex flex-col items-center justify-center p-2 rounded-xl border shadow-sm ${fbmResults.netMargin >= 15 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : (fbmResults.netMargin > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800')}`}>
                                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Margem / ROI</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-lg leading-none">{fbmResults.netMargin.toFixed(1)}%</span>
                                    <span className="text-[10px] font-bold opacity-80">/ {fbmResults.roi.toFixed(0)}% ROI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Export Actions */}
            <div className="flex justify-center gap-6 mt-10">
                <button className="flex items-center gap-3 bg-[#007185] hover:bg-[#005a6a] text-white px-12 py-3.5 rounded-lg text-lg font-bold transition-all shadow-lg shadow-[#007185]/20 ring-4 ring-[#007185]/10">
                    <Download className="w-5 h-5" />
                    Gerar Relatório Estratégico AI (PDF)
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-dark-800 px-4 py-2 rounded-full cursor-help">
                    <Info className="w-4 h-4" />
                    Os dados levam em conta IVA {taxRate}%, taxas SP-API em tempo real e projeção estratégica de IA.
                </div>
            </div>
        </div>
    );
};
