import React, { useState, useRef } from 'react';
import {
    DollarSign, Info, Download, BarChart3, TrendingUp,
    Wallet, Sparkles, Search, Package, Box, RefreshCw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { jsPDF } from 'jspdf';
import { getRecommendations } from '../../lib/strategicRecommendations';
import { searchProducts } from '../../services/amazonAuthService';
import { useAuth } from '../../contexts/AuthContext';
import { ProductMetadata } from '../../types';

export const ProfitCalculator: React.FC = () => {
    const { t, language } = useLanguage();
    const { user } = useAuth();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [marketplace, setMarketplace] = useState('A1RKKUPIHCS9HS'); // ES Default
    const [product, setProduct] = useState<ProductMetadata | null>(null);
    const [isFeesExpanded, setIsFeesExpanded] = useState(true);

    // Common Calculator State
    const [cogs, setCogs] = useState<number>(0);
    const [otherCosts, setOtherCosts] = useState<number>(1.00);
    const [taxRate, setTaxRate] = useState<number>(10);
    const [estimatedSales, setEstimatedSales] = useState<number>(1);

    // FBA Column State
    const [fbaPrice, setFbaPrice] = useState<number>(100);
    const [fbaAmazonFees, setFbaAmazonFees] = useState<number>(15);
    const [fbaReferralFee, setFbaReferralFee] = useState<number>(15);
    const [fbaFulfilmentCost, setFbaFulfilmentCost] = useState<number>(5);
    const [fbaStorageCost, setFbaStorageCost] = useState<number>(0.20);

    // FBM Column State
    const [fbmPrice, setFbmPrice] = useState<number>(100);
    const [fbmDeliveryCharge, setFbmDeliveryCharge] = useState<number>(0);
    const [fbmAmazonFees, setFbmAmazonFees] = useState<number>(15);
    const [fbmReferralFee, setFbmReferralFee] = useState<number>(15);
    const [fbmFulfilmentCost, setFbmFulfilmentCost] = useState<number>(3.50);
    const [fbmStorageCost, setFbmStorageCost] = useState<number>(0);

    // Calculation Logic
    const calculateResults = (price: number, fees: number, fulfilment: number, storage: number, shippingOut: number) => {
        const totalSales = price + shippingOut;
        const taxAmount = totalSales * (taxRate / 100);
        const totalExpenses = fees + fulfilment + storage + cogs + otherCosts + taxAmount;
        const netProfit = totalSales - totalExpenses;
        const netMargin = totalSales ? (netProfit / totalSales) * 100 : 0;
        const roi = cogs > 0 ? (netProfit / cogs) * 100 : 0;
        return { netProfit, netMargin, roi, totalExpenses, taxAmount };
    };

    const fbaResults = calculateResults(fbaPrice, fbaAmazonFees, fbaFulfilmentCost, fbaStorageCost, 0);
    const fbmResults = calculateResults(fbmPrice, fbmAmazonFees, fbmFulfilmentCost, fbmStorageCost, fbmDeliveryCharge);

    const formatCurrency = (amount: number, curr?: string) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: curr || product?.currency || (marketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR')
        }).format(amount);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const data = await searchProducts(searchQuery, marketplace);
            if (data && data.items && data.items.length > 0) {
                const item = data.items[0];
                const summary = item.summaries?.[0];
                const attributes = item.attributes;

                const dims = attributes?.item_dimensions?.[0];
                const weight = attributes?.item_weight?.[0];

                const bsrData = data.items[0] as any;
                const price = summary?.price?.amount || 0;

                setProduct({
                    id: item.asin,
                    title: summary?.itemName || 'Unknown Product',
                    image: item.images?.[0]?.images?.[0]?.link,
                    brand: summary?.brandName || summary?.brand,
                    category: summary?.websiteDisplayGroupName,
                    price: price,
                    currency: summary?.price?.currencyCode,
                    bsr: bsrData?.salesRanks?.[0]?.rank,
                    offers: bsrData?.activeSellers,
                    dimensions: dims ? {
                        length: dims.length,
                        width: dims.width,
                        height: dims.height,
                        unit: dims.unit
                    } : undefined,
                    weight: weight ? {
                        value: weight.value,
                        unit: weight.unit
                    } : undefined
                });

                // Auto-populate prices
                if (price > 0) {
                    setFbaPrice(price);
                    setFbmPrice(price);
                }

                // Estimate referral fee (15% standard)
                const estReferral = price * 0.15;
                setFbaReferralFee(estReferral);
                setFbmReferralFee(estReferral);
                setFbaAmazonFees(estReferral);
                setFbmAmazonFees(estReferral);

            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        // PDF Export logic... (simplified for now to focus on UI)
        doc.text('Relatório Calculadora FBA vs FBM', 105, 20, { align: 'center' });
        doc.save(`calculo-fba-vs-fbm.pdf`);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header & Search Area */}
            <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 border border-gray-100 dark:border-dark-700 shadow-sm transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20">
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('sim.fba_vs_fbm')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                                Analise custos e margens reais comparando os dois modelos de logística.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('sim.search_placeholder')}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                            />
                        </div>
                        <select
                            value={marketplace}
                            onChange={(e) => setMarketplace(e.target.value)}
                            className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                        >
                            <option value="A1RKKUPIHCS9HS">🇪🇸 ES</option>
                            <option value="ATVPDKIKX0DER">🇺🇸 US</option>
                            <option value="A2Q3Y263D00KWC">🇧🇷 BR</option>
                            <option value="A1F83G8C2ARO7P">🇬🇧 UK</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand-600/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {t('sim.search_button')}
                        </button>
                    </form>
                </div>

                {/* Product Detail Card (If searched) */}
                {product && (
                    <div className="bg-gray-50/50 dark:bg-dark-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-dark-700 flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-32 h-32 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-2 flex-shrink-0 flex items-center justify-center">
                            {product.image ? (
                                <img src={product.image} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            ) : (
                                <Package className="w-12 h-12 text-gray-200" />
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{product.title}</h3>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                    <span className="bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                                        ASIN: {product.id}
                                    </span>
                                    {product.brand && <span className="text-gray-500 font-medium">Marca: <span className="text-gray-900 dark:text-white">{product.brand}</span></span>}
                                    {product.bsr && <span className="text-gray-500 font-medium">Nº {product.bsr.toLocaleString()} em <span className="text-gray-900 dark:text-white">{product.category || 'Categoría'}</span></span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm py-4 border-y border-gray-100 dark:border-dark-700">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Peso da Unidade</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {product.weight ? `${product.weight.value} ${product.weight.unit}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Dimensões p/ Embalagem</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-[11px]">
                                        {product.dimensions ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.unit}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Vendedores</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-base">
                                        {product.offers || '1'} {product.offers === 1 ? 'oferta' : 'ofertas'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Preço Atual</p>
                                    <p className="font-bold text-brand-600 text-lg">
                                        {formatCurrency(product.price || 0)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setProduct(null)}
                                className="text-gray-400 hover:text-red-500 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                                <X className="w-3 h-3" /> {t('sim.search_another')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Comparison Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                {/* Column 1: FBA */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="bg-brand-500/5 dark:bg-brand-500/10 px-8 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                            <h3 className="font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2">
                                <Box className="w-5 h-5" />
                                {t('sim.amazon_fulfilment')}
                            </h3>
                            <span className="text-[10px] font-black uppercase text-brand-600/50">FBA Model</span>
                        </div>

                        <div className="p-8 flex-1 space-y-6">
                            {/* Form Group */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">{t('sim.item_price')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                        <input
                                            type="number"
                                            value={fbaPrice}
                                            onChange={(e) => setFbaPrice(Number(e.target.value))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>

                                {/* Fees Section (Expandable) */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setIsFeesExpanded(!isFeesExpanded)}
                                        className="flex items-center justify-between w-full text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase pt-4 transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {t('sim.amazon_fees')} {formatCurrency(fbaAmazonFees)}
                                            {isFeesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </span>
                                    </button>

                                    {isFeesExpanded && (
                                        <div className="space-y-3 pl-2 py-2 animate-in slide-in-from-top-1 duration-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 font-medium">{t('sim.referral_fee')}</span>
                                                <input
                                                    type="number"
                                                    value={fbaReferralFee}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setFbaReferralFee(val);
                                                        setFbaAmazonFees(val);
                                                    }}
                                                    className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 font-medium">{t('sim.fulfilment_cost')} (FBA)</span>
                                                <input
                                                    type="number"
                                                    value={fbaFulfilmentCost}
                                                    onChange={(e) => setFbaFulfilmentCost(Number(e.target.value))}
                                                    className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 font-medium">{t('sim.storage_cost')}</span>
                                                <input
                                                    type="number"
                                                    value={fbaStorageCost}
                                                    onChange={(e) => setFbaStorageCost(Number(e.target.value))}
                                                    className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Common Inputs */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">{t('sim.cogs')}</label>
                                        <input
                                            type="number"
                                            value={cogs}
                                            onChange={(e) => setCogs(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">{t('sim.vat')} (%)</label>
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FBA Footer RESULTS */}
                        <div className="bg-brand-600 p-8">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-brand-200 text-xs font-bold uppercase tracking-wider mb-1">{t('sim.net_proceeds')}</p>
                                    <h4 className="text-3xl font-black text-white">{formatCurrency(fbaResults.netProfit)}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-brand-200 text-xs font-bold uppercase tracking-wider mb-1">Margem Líquida</p>
                                    <h4 className="text-2xl font-black text-white">{fbaResults.netMargin.toFixed(1)}%</h4>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-brand-200 font-bold pt-4 border-t border-brand-500">
                                <span>{t('sim.roi')}: {fbaResults.roi.toFixed(0)}%</span>
                                <span>Custos Totais: {formatCurrency(fbaResults.totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: FBM */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 px-8 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                            <h3 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                {t('sim.your_fulfilment')}
                            </h3>
                            <span className="text-[10px] font-black uppercase text-emerald-600/50">FBM Model</span>
                        </div>

                        <div className="p-8 flex-1 space-y-6">
                            {/* Form Group */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">{t('sim.item_price')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                        <input
                                            type="number"
                                            value={fbmPrice}
                                            onChange={(e) => setFbmPrice(Number(e.target.value))}
                                            className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">{t('sim.delivery_charge')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                        <input
                                            type="number"
                                            value={fbmDeliveryCharge}
                                            onChange={(e) => setFbmDeliveryCharge(Number(e.target.value))}
                                            className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fees Section */}
                            <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-dark-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">{t('sim.referral_fee')} (Manual)</span>
                                    <input
                                        type="number"
                                        value={fbmReferralFee}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFbmReferralFee(val);
                                            setFbmAmazonFees(val);
                                        }}
                                        className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">{t('sim.fulfilment_cost')} (Frete + Prep)</span>
                                    <input
                                        type="number"
                                        value={fbmFulfilmentCost}
                                        onChange={(e) => setFbmFulfilmentCost(Number(e.target.value))}
                                        className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">{t('sim.other_costs')}</span>
                                    <input
                                        type="number"
                                        value={otherCosts}
                                        onChange={(e) => setOtherCosts(Number(e.target.value))}
                                        className="w-24 text-right bg-transparent border-b border-gray-200 dark:border-dark-700 font-bold focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div className="pt-4 mt-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Preço Total de Venda</label>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(fbmPrice + fbmDeliveryCharge)}</p>
                                </div>
                            </div>
                        </div>

                        {/* FBM Footer RESULTS */}
                        <div className="bg-emerald-600 p-8">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">{t('sim.net_proceeds')}</p>
                                    <h4 className="text-3xl font-black text-white">{formatCurrency(fbmResults.netProfit)}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">Margem Líquida</p>
                                    <h4 className="text-2xl font-black text-white">{fbmResults.netMargin.toFixed(1)}%</h4>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-emerald-200 font-bold pt-4 border-t border-emerald-500">
                                <span>{t('sim.roi')}: {fbmResults.roi.toFixed(0)}%</span>
                                <span>Custos Totais: {formatCurrency(fbmResults.totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Actions */}
            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 px-8 py-3 rounded-2xl text-base font-bold transition-all border border-gray-200 dark:border-dark-700 shadow-sm"
                >
                    <Download className="w-5 h-5" />
                    Exportar Comparação (PDF)
                </button>
            </div>
        </div>
    );
};
