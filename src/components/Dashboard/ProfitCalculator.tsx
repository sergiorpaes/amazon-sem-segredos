import React, { useState, useMemo } from 'react';
import {
    DollarSign, Info, Download, BarChart3, TrendingUp,
    Wallet, Sparkles, Search, Package, Box, RefreshCw, X, ChevronDown, ChevronUp,
    Target, Lightbulb, Activity, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { jsPDF } from 'jspdf';
import { getRecommendations } from '../../lib/strategicRecommendations';
import { searchProducts, SUPPORTED_MARKETPLACES } from '../../services/amazonAuthService';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ProductMetadata } from '../../types';
import { getSupplierLinks } from '../../lib/sourcingUtils';

export const ProfitCalculator: React.FC = () => {
    const { t, language } = useLanguage();
    const { enabledMarketplaces } = useSettings();

    // Filter marketplaces based on settings
    const availableMarketplaces = SUPPORTED_MARKETPLACES.filter(m => enabledMarketplaces.includes(m.id));

    // Default to Brazil if available, otherwise first available
    const defaultMarketplace = availableMarketplaces.find(m => m.id === 'A2Q3Y263D00KWC')?.id || availableMarketplaces[0]?.id || 'A2Q3Y263D00KWC';

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [marketplace, setMarketplace] = useState<string>(defaultMarketplace);
    const [product, setProduct] = useState<ProductMetadata | null>(null);

    // Effect to ensure selected marketplace is valid when settings change
    React.useEffect(() => {
        if (!enabledMarketplaces.includes(marketplace)) {
            const fallback = availableMarketplaces[0]?.id || 'A2Q3Y263D00KWC';
            setMarketplace(fallback);
        }
    }, [enabledMarketplaces, marketplace, availableMarketplaces]);
    const [fbaFeesExpanded, setFbaFeesExpanded] = useState(true);
    const [fbmFeesExpanded, setFbmFeesExpanded] = useState(true);
    const [fbaStorageExpanded, setFbaStorageExpanded] = useState(true);
    const [fbmStorageExpanded, setFbmStorageExpanded] = useState(true);
    const [fbaStrategyExpanded, setFbaStrategyExpanded] = useState(true);
    const [fbmStrategyExpanded, setFbmStrategyExpanded] = useState(true);

    // Seasonal State
    const [season, setSeason] = useState<'jan-sep' | 'oct-dec'>('jan-sep');

    // --- Common Inputs (Synced between FBA/FBM) ---
    const [cogs, setCogs] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(21); // Default ES VAT (Amazon fixed)
    const [batchSize, setBatchSize] = useState<number>(1);

    // Prep Service (Synced)
    const [prepLabor, setPrepLabor] = useState<number>(0);
    const [prepMaterial, setPrepMaterial] = useState<number>(0);
    const [prepInbound, setPrepInbound] = useState<number>(0);
    const prepTotal = prepLabor + prepMaterial + prepInbound;

    // FBA State
    const [fbaPrice, setFbaPrice] = useState<number>(0);
    const [fbaReferral, setFbaReferral] = useState<number>(15.00);     // Amazon fee (kept)
    const [fbaFixedClosing, setFbaFixedClosing] = useState<number>(0);
    const [fbaVariableClosing, setFbaVariableClosing] = useState<number>(0);
    const [fbaDigitalServices, setFbaDigitalServices] = useState<number>(0.30); // Amazon fee (kept)
    const [fbaFulfilment, setFbaFulfilment] = useState<number>(5.50);  // Amazon fee (kept)

    // FBA Storage Detailed
    const [fbaMonthlyStoragePrice, setFbaMonthlyStoragePrice] = useState<number>(0.80); // Amazon rate (kept)
    const [fbaAvgInventory, setFbaAvgInventory] = useState<number>(0);
    const [fbaEstSales, setFbaEstSales] = useState<number>(0);

    const [fbaMiscCost, setFbaMiscCost] = useState<number>(0);
    const [fbaAdsCost, setFbaAdsCost] = useState<number>(0);

    // FBM State
    const [fbmPrice, setFbmPrice] = useState<number>(0);
    const [fbmShippingOut, setFbmShippingOut] = useState<number>(0);
    const [fbmReferral, setFbmReferral] = useState<number>(15.00);     // Amazon fee (kept)
    const [fbmFixedClosing, setFbmFixedClosing] = useState<number>(0);
    const [fbmVariableClosing, setFbmVariableClosing] = useState<number>(0);
    const [fbmDigitalServices, setFbmDigitalServices] = useState<number>(0.30); // Amazon fee (kept)
    const [fbmFulfilment, setFbmFulfilment] = useState<number>(0);     // User's own logistics cost

    // FBM Storage Detailed
    const [fbmMonthlyStoragePrice, setFbmMonthlyStoragePrice] = useState<number>(0);
    const [fbmAvgInventory, setFbmAvgInventory] = useState<number>(0);
    const [fbmEstSales, setFbmEstSales] = useState<number>(0);

    const [fbmMiscCost, setFbmMiscCost] = useState<number>(0);
    const [fbmAdsCost, setFbmAdsCost] = useState<number>(0);

    // --- Calculations ---
    const calculateStorage = (monthlyRate: number, avgInv: number, estSales: number) => {
        if (!estSales || estSales === 0) return 0;
        const rateMultiplier = season === 'oct-dec' ? 3 : 1;
        return (monthlyRate * rateMultiplier * avgInv) / estSales;
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

        // Final Expenses: Includes synchronized COGS and Prep costs
        const totalExpenses = fees + fulfilment + storage + misc + cogs + prepTotal + taxAmount + ads;
        const netProfit = totalSales - totalExpenses;
        const netMargin = totalSales ? (netProfit / totalSales) * 100 : 0;

        // ROI: Net Profit / Total Direct Investment (COGS + Prep)
        const totalInvestment = cogs + prepTotal;
        const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

        // Break-even logic (approximate including variable taxes and referral %)
        const referralRate = price > 0 ? fees / price : 0.15;
        const taxRateNormalized = taxRate / 100;
        const fixedCosts = fulfilment + storage + misc + cogs + prepTotal + ads;
        const breakEven = fixedCosts / (1 - (referralRate + taxRateNormalized));

        return { netProfit, netMargin, roi, totalExpenses, taxAmount, totalSales, breakEven };
    };

    const fbaResults = calcResults(fbaPrice, 0, fbaTotalAmazonFees, fbaFulfilment, fbaUnitStorage, fbaMiscCost, fbaAdsCost);
    const fbmResults = calcResults(fbmPrice, fbmShippingOut, fbmTotalAmazonFees, fbmFulfilment, fbmUnitStorage, fbmMiscCost, fbmAdsCost);

    const getMarginColor = (margin: number) => {
        if (margin >= 20) return 'text-emerald-600 dark:text-emerald-400';
        if (margin >= 10) return 'text-amber-500 dark:text-amber-400';
        return 'text-red-500 dark:text-red-400';
    };

    const getMarginBg = (margin: number) => {
        if (margin >= 20) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        if (margin >= 10) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
    };

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
            setError(t('sim.asin_error'));
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

                // Use the explicit price and currency from our proxy processing
                const price = (item as any).price || summary?.price?.amount || 0;
                const currency = (item as any).currency || summary?.price?.currencyCode || (marketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR');

                setProduct({
                    id: item.asin,
                    title: summary?.itemName || 'Unknown Product',
                    image: item.images?.[0]?.images?.[0]?.link,
                    brand: summary?.brandName || summary?.brand,
                    category: summary?.websiteDisplayGroupName,
                    price: price,
                    currency: currency,
                    bsr: (item as any).salesRanks?.[0]?.rank || (item as any).bsr, // Check both locations
                    offers: (item as any).active_sellers,
                    dimensions: dims ? { length: dims.length, width: dims.width, height: dims.height, unit: dims.unit } : undefined,
                    weight: weight ? { value: weight.value, unit: weight.unit } : undefined
                });

                if (price > 0) {
                    setFbaPrice(price);
                    setFbmPrice(price);

                    // Use Real Data from SP-API if available (Referral and Fulfillment)
                    const realFees = (item as any).spapi_fees;
                    if (realFees) {
                        setFbaReferral(realFees.referral);
                        setFbmReferral(realFees.referral);
                        setFbaFulfilment(realFees.fulfillment);
                        console.log(`[Calculator] Using REAL SP-API Fees: ${realFees.referral} (Ref) / ${realFees.fulfillment} (FBA Full)`);
                    } else {
                        const estRef = price * 0.15;
                        setFbaReferral(estRef);
                        setFbmReferral(estRef);
                    }
                }

            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('sim.search_failed'));
        } finally { setIsSearching(false); }
    };

    // --- PDF Generation ---
    const handleGeneratePDF = () => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const col1X = margin;
        const col2X = pageW / 2 + 4;
        let y = 20;

        const curr = product?.currency || (marketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR');
        const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(n);
        const pct = (n: number) => `${n.toFixed(1)}%`;

        // ---- Header ----
        doc.setFillColor(0, 113, 133);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(t('sim.report_title'), margin, 13);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t('sim.generated_at')}: ${new Date().toLocaleString(language === 'pt' ? 'pt-BR' : (language === 'es' ? 'es-ES' : 'en-US'))}`, margin, 21);
        doc.text(t('sim.suite_name'), pageW - margin, 21, { align: 'right' });

        // ---- Product Info ----
        y = 36;
        doc.setTextColor(50, 50, 50);
        if (product) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 113, 133);
            doc.text(t('sim.analyzed_product'), margin, y);
            y += 6;
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const titleLines = doc.splitTextToSize(product.title, pageW - margin * 2);
            doc.text(titleLines, margin, y);
            y += titleLines.length * 5 + 2;

            const meta: [string, string][] = [
                [`ASIN: ${product.id}`, `Marca: ${product.brand || '-'}`],
                [`Categoria: ${product.category || '-'}`, `BSR: ${product.bsr ? '#' + product.bsr.toLocaleString() : '-'}`],
                [`Preço de Venda: ${fmt(product.price || 0)}`, `Marketplace: ${SUPPORTED_MARKETPLACES.find(m => m.id === marketplace)?.name || marketplace}`],
            ];
            meta.forEach(([a, b]) => {
                doc.setFont('helvetica', 'bold');
                doc.text(a, margin, y);
                doc.text(b, pageW / 2, y);
                y += 5;
            });
            y += 4;
        } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text(t('sim.no_product_search'), margin, y);
            y += 8;
        }

        // ---- Divider ----
        doc.setDrawColor(0, 113, 133);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        // ---- Side-by-side FBA / FBM ----
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 113, 133);
        doc.text(t('sim.fba_title'), col1X, y);
        doc.text(t('sim.fbm_title'), col2X, y);
        y += 5;

        doc.setFontSize(9);
        const addRow = (label: string, fbaVal: string, fbmVal: string, bold = false) => {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(70, 70, 70);
            doc.text(label, col1X, y);
            doc.text(fbaVal, col1X + 50, y, { align: 'right' });
            doc.text(label, col2X, y);
            doc.text(fbmVal, col2X + 50, y, { align: 'right' });
            y += 5;
        };

        addRow('Preço de Venda', fmt(fbaPrice), fmt(fbmPrice));
        addRow('Taxas Amazon', fmt(fbaTotalAmazonFees), fmt(fbmTotalAmazonFees));
        addRow('Fulfillment', fmt(fbaFulfilment), fmt(fbmFulfilment));
        addRow('Armazenamento/un.', fmt(fbaUnitStorage), fmt(fbmUnitStorage));
        addRow('COGS', fmt(cogs), fmt(cogs));
        addRow('Prep Service', fmt(prepTotal), fmt(prepTotal));
        addRow('Publicidade', fmt(fbaAdsCost), fmt(fbmAdsCost));
        addRow('IVA / Impostos', fmt(fbaResults.taxAmount), fmt(fbmResults.taxAmount));
        addRow('Outros Custos', fmt(fbaMiscCost), fmt(fbmMiscCost));

        // Separator line
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(col1X, y, col1X + 76, y);
        doc.line(col2X, y, col2X + 76, y);
        y += 4;

        const setResultColor = (margin: number) => {
            if (margin >= 20) doc.setTextColor(16, 148, 101);
            else if (margin >= 10) doc.setTextColor(217, 119, 6);
            else doc.setTextColor(220, 38, 38);
        };

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        setResultColor(fbaResults.netMargin);
        doc.text(`${t('sim.net_profit')}:`, col1X, y);
        doc.text(fmt(fbaResults.netProfit), col1X + 76, y, { align: 'right' });
        setResultColor(fbmResults.netMargin);
        doc.text(`${t('sim.net_profit')}:`, col2X, y);
        doc.text(fmt(fbmResults.netProfit), col2X + 76, y, { align: 'right' });
        y += 6;

        setResultColor(fbaResults.netMargin);
        doc.text(`${t('sim.net_margin')}: ${pct(fbaResults.netMargin)}`, col1X, y);
        doc.text(`${t('sim.roi')}: ${fbaResults.roi.toFixed(0)}%`, col1X + 76, y, { align: 'right' });
        setResultColor(fbmResults.netMargin);
        doc.text(`${t('sim.net_margin')}: ${pct(fbmResults.netMargin)}`, col2X, y);
        doc.text(`${t('sim.roi')}: ${fbmResults.roi.toFixed(0)}%`, col2X + 76, y, { align: 'right' });
        y += 6;

        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Break-even: ${fmt(fbaResults.breakEven)}`, col1X, y);
        doc.text(`Break-even: ${fmt(fbmResults.breakEven)}`, col2X, y);
        y += 5;
        doc.text(`Lucro p/ Lote (${batchSize} un.): ${fmt(fbaResults.netProfit * batchSize)}`, col1X, y);
        doc.text(`Lucro p/ Lote (${batchSize} un.): ${fmt(fbmResults.netProfit * batchSize)}`, col2X, y);
        y += 10;

        // ---- Strategic Recommendations ----
        doc.setDrawColor(0, 113, 133);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 113, 133);
        doc.text(`${t('sim.pdf_recs_title')} (FBA)`, margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        fbaRecommendations.forEach(rec => {
            const lines = doc.splitTextToSize(`• ${rec}`, pageW - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 1;
        });

        // ---- Footer ----
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
            t('sim.pdf_footer', { taxRate: taxRate.toString() }),
            pageW / 2, footerY, { align: 'center' }
        );

        const asin = product?.id || 'manual';
        const dateStr = new Date().toISOString().split('T')[0];
        doc.save(`relatorio-${asin}-${dateStr}.pdf`);
    };

    // UI Helpers
    const DataRow = ({ label, value, isBold = false, indent = false, colorClass = "" }: { label: string, value: string | React.ReactNode, isBold?: boolean, indent?: boolean, colorClass?: string }) => (
        <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-4' : ''}`}>
            <span className={`text-sm ${isBold ? 'font-bold' : ''} ${colorClass || 'text-gray-600 dark:text-gray-300'}`}>
                {label}
            </span>
            <span className={`text-sm ${isBold ? 'font-bold' : ''} ${colorClass || 'text-gray-700 dark:text-white'}`}>
                {value}
            </span>
        </div>
    );

    const InputRow = ({ label, value, onChange, prefix, suffix, help }: { label: string, value: number, onChange: (val: number) => void, prefix?: string, suffix?: string, help?: string }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                {label}
                {help && <div className="group relative"><Info className="w-3 h-3 text-gray-300 dark:text-gray-500 cursor-help" /><div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 dark:bg-dark-800 text-white text-[10px] rounded hidden group-hover:block z-50 border border-dark-700">{help}</div></div>}
            </span>
            <div className="flex items-center gap-1">
                {prefix && <span className="text-xs text-gray-400 dark:text-gray-500">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-20 text-right bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#007185]"
                />
                {suffix && <span className="text-xs text-gray-400 dark:text-gray-500">{suffix}</span>}
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
                            placeholder={t('sim.search_placeholder')}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-700 text-base shadow-inner transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                    </div>
                    <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="bg-gray-50 dark:bg-dark-800 border-none rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none max-w-[150px] shadow-inner focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-700 transition-all cursor-pointer">
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
                                    {t('sim.api_403_hint')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {product ? (
                    <div className="mt-8 flex gap-6 items-start border-t border-gray-100 dark:border-dark-700 pt-8 animate-in fade-in duration-500">
                        {product.image && <div className="w-24 h-24 flex-shrink-0 bg-white border border-gray-100 dark:border-dark-700 rounded-xl p-2 shadow-sm"><img src={product.image} className="w-full h-full object-contain" alt="" /></div>}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{product.title}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">ASIN</span> <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-dark-800 px-2 py-0.5 rounded w-fit select-all">{product.id}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">{t('sim.weight')}</span> <span className="font-bold text-gray-900 dark:text-gray-100">{product.weight ? `${product.weight.value} ${product.weight.unit}` : '-'}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">{t('sim.sales_rank')}</span> <span className="font-bold text-gray-900 dark:text-gray-100">#{product.bsr?.toLocaleString() || '-'}</span></div>
                                <div className="flex flex-col items-start gap-2 lg:items-end justify-center">
                                    <button onClick={() => setProduct(null)} className="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:underline font-bold text-xs transition-colors">{t('sim.search_another')}</button>
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
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{t('sim.simulate_rentability')}</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm">{t('sim.simulate_desc')}</p>
                    </div>
                )}
            </div>

            {/* Global Settings Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-700/50 rounded-xl p-4 flex flex-wrap gap-6 items-center justify-center shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t('sim.cogs')}</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-700/50 rounded px-2 py-1">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">{product?.currency === 'USD' ? '$' : (product?.currency === 'BRL' ? 'R$' : '€')}</span>
                        <input type="number" value={cogs} onChange={(e) => setCogs(Number(e.target.value))} className="w-16 bg-transparent outline-none text-sm font-bold text-center text-gray-900 dark:text-white" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t('sim.iva')} (%)</span>
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-14 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-700/50 rounded px-2 py-1 text-sm font-bold text-center text-gray-900 dark:text-white" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t('sim.batch')}</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-emerald-200 dark:border-emerald-700/50 rounded px-2 py-1">
                        <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="w-14 bg-transparent outline-none text-sm font-bold text-center text-gray-900 dark:text-white" />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{t('sim.units_abbr')}</span>
                    </div>
                </div>

                {/* Prep Service Section */}
                <div className="h-8 w-px bg-emerald-200 dark:bg-emerald-900/30 hidden md:block mx-2" />
                <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Prep Service</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('sim.labor')}</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                <input type="number" value={prepLabor} onChange={(e) => setPrepLabor(Number(e.target.value))} className="w-12 bg-transparent outline-none text-xs font-bold text-center text-gray-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('sim.material')}</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                <input type="number" value={prepMaterial} onChange={(e) => setPrepMaterial(Number(e.target.value))} className="w-12 bg-transparent outline-none text-xs font-bold text-center text-gray-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('sim.inbound')}</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{product?.currency === 'BRL' ? 'R$' : '€'}</span>
                                <input type="number" value={prepInbound} onChange={(e) => setPrepInbound(Number(e.target.value))} className="w-12 bg-transparent outline-none text-xs font-bold text-center text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LOGÍSTICA DA AMAZON (FBA) */}
                <div className="bg-white dark:bg-dark-800 rounded-sm border border-[#d5dbdb] dark:border-dark-700 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] dark:border-dark-700 flex justify-between items-center bg-[#f0f2f2] dark:bg-dark-900/60">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-300 flex items-center gap-2">
                            <Box className="w-4 h-4 text-[#007185]" />
                            {t('sim.fba_title')}
                        </h4>
                        <X className="w-4 h-4 text-gray-400 dark:text-gray-600 cursor-pointer" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col space-y-4">
                        <InputRow label={t('sim.item_price')} value={fbaPrice} onChange={setFbaPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbaFeesExpanded(!fbaFeesExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] dark:text-white py-1 mb-2">
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
                            <button onClick={() => setFbaStorageExpanded(!fbaStorageExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] dark:text-gray-200 py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.storage_cost')} {formatCurrency(fbaUnitStorage)}
                                    {fbaStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbaStorageExpanded && (
                                <div className="space-y-3 animate-in slide-in-from-top-1">
                                    <div className="flex rounded overflow-hidden border border-[#d5dbdb] dark:border-dark-700 text-[10px] font-bold">
                                        <button onClick={() => setSeason('jan-sep')} className={`flex-1 py-1.5 transition-colors ${season === 'jan-sep' ? 'bg-[#007185] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{t('sim.jan_sep')}</button>
                                        <button onClick={() => setSeason('oct-dec')} className={`flex-1 py-1.5 transition-colors ${season === 'oct-dec' ? 'bg-[#007185] text-white' : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>{t('sim.oct_dec')}</button>
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
                                    {t('sim.strategy_advice')}
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
                                        <p className="text-[10px] text-emerald-600/70 mt-1 italic">{t('sim.break_even_desc')}</p>
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
                            <DataRow label={t('sim.iva')} value={formatCurrency(fbaResults.taxAmount)} />
                        </div>
                    </div>

                    {/* FBA Results Overlay Footer */}
                    <div className={`p-5 mt-auto border-t transition-colors ${getMarginBg(fbaResults.netMargin)}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-white/50 dark:border-dark-700/50">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{t('sim.total_cost')}</span>
                                <span className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(fbaResults.totalExpenses)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-white/50 dark:border-dark-700/50">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{t('sim.profit_batch')}</span>
                                <span className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(fbaResults.netProfit * batchSize)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-white dark:border-dark-700">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">{t('sim.net_profit')}</span>
                                <span className={`font-black text-xl leading-none ${getMarginColor(fbaResults.netMargin)}`}>{formatCurrency(fbaResults.netProfit)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-white dark:border-dark-700">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">{t('sim.net_margin')} / ROI</span>
                                <div className="flex flex-col items-center">
                                    <span className={`font-black text-xl leading-none ${getMarginColor(fbaResults.netMargin)}`}>{fbaResults.netMargin.toFixed(1)}%</span>
                                    <span className="text-[10px] font-bold opacity-60 dark:text-gray-400">{t('sim.roi')}: {fbaResults.roi.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* O SEU TIPO DE LOGÍSTICA (FBM) */}
                <div className="bg-white dark:bg-dark-800 rounded-sm border border-[#d5dbdb] dark:border-dark-700 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] dark:border-dark-700 flex justify-between items-center bg-[#f0f2f2] dark:bg-dark-900/60">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-300 flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#007185]" />
                            {t('sim.fbm_title')}
                        </h4>
                        <X className="w-4 h-4 text-gray-400 dark:text-gray-600 cursor-pointer" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputRow label={t('sim.item_price')} value={fbmPrice} onChange={setFbmPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <InputRow label={t('sim.shipping_out')} value={fbmShippingOut} onChange={setFbmShippingOut} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-900/50 p-2 rounded border border-dashed border-gray-200 dark:border-dark-700 flex justify-between">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('sim.total_sales_price')}</span>
                            <span className="text-sm font-black text-[#007185]">{formatCurrency(fbmResults.totalSales)}</span>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbmFeesExpanded(!fbmFeesExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] dark:text-gray-200 py-1 mb-2">
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
                            <button className="text-[#007185] text-[10px] hover:underline flex items-center gap-1 mb-2">{t('sim.edit_costs')} <ChevronDown className="w-2.5 h-2.5" /></button>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => setFbmStorageExpanded(!fbmStorageExpanded)} className="flex items-center justify-between w-full text-sm font-bold text-[#333] dark:text-gray-200 py-1 mb-2">
                                <span className="flex items-center gap-1">
                                    {t('sim.storage_cost')} {formatCurrency(fbmUnitStorage)}
                                    {fbmStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbmStorageExpanded && (
                                <div className="space-y-2 animate-in slide-in-from-top-1">
                                    <p className="text-[11px] text-[#c45500] font-bold">{t('sim.fbm_storage_hint')}</p>
                                    <InputRow label={t('sim.storage_per_unit')} value={fbmMonthlyStoragePrice} onChange={setFbmMonthlyStoragePrice} />
                                    <InputRow label={t('sim.avg_inventory')} value={fbmAvgInventory} onChange={setFbmAvgInventory} />
                                    <DataRow label={t('sim.storage_per_sold')} value={formatCurrency(fbmUnitStorage)} isBold />
                                </div>
                            )}
                        </div>

                        {/* ADVANCED STRATEGY SECTION (FBM) */}
                        <div className="border-t border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-900/5 p-4 -mx-5 space-y-4">
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
                                        <p className="text-[10px] text-emerald-600/70 mt-1 italic">{t('sim.fbm_break_even_desc')}</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-1.5 mb-2 text-blue-700 dark:text-blue-400">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('sim.strategy_fbm_title')}</span>
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
                            <DataRow label={t('sim.iva')} value={formatCurrency(fbmResults.taxAmount)} />
                        </div>
                    </div>

                    {/* FBM Results Footer Results */}
                    <div className={`p-5 mt-auto border-t transition-colors ${getMarginBg(fbmResults.netMargin)}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-white/50 dark:border-dark-700/50">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Custo Total</span>
                                <span className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(fbmResults.totalExpenses)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm border border-white/50 dark:border-dark-700/50">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Lucro por Lote</span>
                                <span className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(fbmResults.netProfit * batchSize)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-white dark:border-dark-700">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Lucro Líquido</span>
                                <span className={`font-black text-xl leading-none ${getMarginColor(fbmResults.netMargin)}`}>{formatCurrency(fbmResults.netProfit)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-white dark:border-dark-700">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Margem / ROI</span>
                                <div className="flex flex-col items-center">
                                    <span className={`font-black text-xl leading-none ${getMarginColor(fbmResults.netMargin)}`}>{fbmResults.netMargin.toFixed(1)}%</span>
                                    <span className="text-[10px] font-bold opacity-60 dark:text-gray-400">ROI: {fbmResults.roi.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Export Actions */}
            <div className="flex justify-center gap-6 mt-10">
                <button
                    onClick={handleGeneratePDF}
                    className="flex items-center gap-3 bg-[#007185] hover:bg-[#005a6a] text-white dark:text-emerald-50 px-12 py-3.5 rounded-lg text-lg font-bold transition-all shadow-lg shadow-[#007185]/20 ring-4 ring-[#007185]/10 active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    Gerar Relatório Estratégico AI (PDF)
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-800 px-4 py-2 rounded-full cursor-help">
                    <Info className="w-4 h-4" />
                    Os dados levam em conta IVA {taxRate}%, taxas SP-API em tempo real e projeção estratégica de IA.
                </div>
            </div>
        </div>
    );
};
