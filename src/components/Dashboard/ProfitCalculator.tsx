import React, { useState } from 'react';
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

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [marketplace, setMarketplace] = useState('A1RKKUPIHCS9HS'); // ES Default
    const [product, setProduct] = useState<ProductMetadata | null>(null);
    const [fbaFeesExpanded, setFbaFeesExpanded] = useState(true);
    const [fbmFeesExpanded, setFbmFeesExpanded] = useState(true);
    const [fbaStorageExpanded, setFbaStorageExpanded] = useState(true);
    const [fbmStorageExpanded, setFbmStorageExpanded] = useState(true);
    const [fbaOtherExpanded, setFbaOtherExpanded] = useState(true);
    const [fbmOtherExpanded, setFbmOtherExpanded] = useState(true);

    // Seasonal State
    const [season, setSeason] = useState<'jan-sep' | 'oct-dec'>('jan-sep');

    // --- Inputs ---
    const [cogs, setCogs] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(21); // Default ES VAT

    // FBA State
    const [fbaPrice, setFbaPrice] = useState<number>(5.50);
    const [fbaReferral, setFbaReferral] = useState<number>(0.83);
    const [fbaFixedClosing, setFbaFixedClosing] = useState<number>(0.00);
    const [fbaVariableClosing, setFbaVariableClosing] = useState<number>(0.00);
    const [fbaDigitalServices, setFbaDigitalServices] = useState<number>(0.02);
    const [fbaFulfilment, setFbaFulfilment] = useState<number>(2.61);

    // FBA Storage Detailed
    const [fbaMonthlyStoragePrice, setFbaMonthlyStoragePrice] = useState<number>(0.02);
    const [fbaAvgInventory, setFbaAvgInventory] = useState<number>(1);
    const [fbaEstSales, setFbaEstSales] = useState<number>(1);

    const [fbaMiscCost, setFbaMiscCost] = useState<number>(0);

    // FBM State
    const [fbmPrice, setFbmPrice] = useState<number>(5.50);
    const [fbmShippingOut, setFbmShippingOut] = useState<number>(0); // Portes de envio
    const [fbmReferral, setFbmReferral] = useState<number>(0.83);
    const [fbmFixedClosing, setFbmFixedClosing] = useState<number>(0.00);
    const [fbmVariableClosing, setFbmVariableClosing] = useState<number>(0.00);
    const [fbmDigitalServices, setFbmDigitalServices] = useState<number>(0.02);
    const [fbmFulfilment, setFbmFulfilment] = useState<number>(0); // Delivery logistics

    // FBM Storage Detailed
    const [fbmMonthlyStoragePrice, setFbmMonthlyStoragePrice] = useState<number>(0);
    const [fbmAvgInventory, setFbmAvgInventory] = useState<number>(0);
    const [fbmEstSales, setFbmEstSales] = useState<number>(1);

    const [fbmMiscCost, setFbmMiscCost] = useState<number>(0);

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

    const calcResults = (price: number, shipping: number, fees: number, fulfilment: number, storage: number, misc: number) => {
        const totalSales = price + shipping;
        const taxAmount = totalSales * (taxRate / 100);
        const totalExpenses = fees + fulfilment + storage + misc + cogs + taxAmount;
        const netProfit = totalSales - totalExpenses;
        const netMargin = totalSales ? (netProfit / totalSales) * 100 : 0;
        const roi = cogs > 0 ? (netProfit / cogs) * 100 : 0;
        return { netProfit, netMargin, roi, totalExpenses, taxAmount, totalSales };
    };

    const fbaResults = calcResults(fbaPrice, 0, fbaTotalAmazonFees, fbaFulfilment, fbaUnitStorage, fbaMiscCost);
    const fbmResults = calcResults(fbmPrice, fbmShippingOut, fbmTotalAmazonFees, fbmFulfilment, fbmUnitStorage, fbmMiscCost);

    const formatCurrency = (amount: number) => {
        const curr = product?.currency || (marketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR');
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: curr
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
            }
        } catch (error) { console.error(error); } finally { setIsSearching(false); }
    };

    // Sub-component for individual rows to match the style
    const DataRow = ({ label, value, isBold = false, indent = false }: { label: string, value: string | React.ReactNode, isBold?: boolean, indent?: boolean }) => (
        <div className={`flex justify-between items-center py-1.5 ${indent ? 'pl-4' : ''}`}>
            <span className={`text-sm ${isBold ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                {label}
            </span>
            <span className={`text-sm ${isBold ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {value}
            </span>
        </div>
    );

    const InputRow = ({ label, value, onChange, prefix, suffix }: { label: string, value: number, onChange: (val: number) => void, prefix?: string, suffix?: string }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <div className="flex items-center gap-1">
                {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-20 text-right bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded px-2 py-0.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Search Header */}
            <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('sim.search_placeholder')}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <select
                        value={marketplace}
                        onChange={(e) => setMarketplace(e.target.value)}
                        className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                    >
                        <option value="A1RKKUPIHCS9HS">🇪🇸 ES</option>
                        <option value="ATVPDKIKX0DER">🇺🇸 US</option>
                        <option value="A2Q3Y263D00KWC">🇧🇷 BR</option>
                        <option value="A1F83G8C2ARO7P">🇬🇧 UK</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-[#007185] hover:bg-[#005a6a] text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {t('sim.search_button')}
                    </button>
                </form>

                {product && (
                    <div className="mt-6 flex gap-6 items-start border-t dark:border-dark-700 pt-6 animate-in fade-in duration-500">
                        {product.image && (
                            <img src={product.image} className="w-20 h-20 object-contain border dark:border-dark-700 rounded p-1 bg-white" alt="" />
                        )}
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.title}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-xs">
                                <div><span className="text-gray-400">ASIN:</span> <span className="font-bold">{product.id}</span></div>
                                <div><span className="text-gray-400">Unit weight:</span> <span className="font-bold">{product.weight ? `${product.weight.value} ${product.weight.unit}` : 'N/A'}</span></div>
                                <div><span className="text-gray-400">Rating:</span> <span className="font-bold">⭐ {product.offers || '1'} offers</span></div>
                                <div><button onClick={() => setProduct(null)} className="text-[#007185] hover:underline font-bold">Search another product</button></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* LOGÍSTICA DA AMAZON (FBA) */}
                <div className="bg-white dark:bg-dark-900 rounded-sm border border-[#d5dbdb] shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] flex justify-between items-center bg-gray-50/50">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-200">Logística da Amazon</h4>
                        <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="p-4 flex-1 space-y-4">
                        <InputRow label="Preço do produto" value={fbaPrice} onChange={setFbaPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbaFeesExpanded(!fbaFeesExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Taxas da Amazon {formatCurrency(fbaTotalAmazonFees)}
                                    {fbaFeesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>

                            {fbaFeesExpanded && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1">
                                    <InputRow label="Referral Fee" value={fbaReferral} onChange={setFbaReferral} />
                                    <InputRow label="Fixed Closing Fee" value={fbaFixedClosing} onChange={setFbaFixedClosing} />
                                    <InputRow label="Variable Closing Fee" value={fbaVariableClosing} onChange={setFbaVariableClosing} />
                                    <InputRow label="Taxa de serviços digitais" value={fbaDigitalServices} onChange={setFbaDigitalServices} />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <DataRow label={`Custo de logística ${formatCurrency(fbaFulfilment)}`} value={<ChevronDown className="w-3 h-3" />} />
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbaStorageExpanded(!fbaStorageExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Custo de armazenamento {formatCurrency(fbaUnitStorage)}
                                    {fbaStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>

                            {fbaStorageExpanded && (
                                <div className="space-y-3 animate-in slide-in-from-top-1">
                                    <div className="flex rounded overflow-hidden border border-[#d5dbdb] text-[10px] font-bold">
                                        <button
                                            onClick={() => setSeason('jan-sep')}
                                            className={`flex-1 py-1.5 transition-colors ${season === 'jan-sep' ? 'bg-[#007185] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Janeiro-setembro
                                        </button>
                                        <button
                                            onClick={() => setSeason('oct-dec')}
                                            className={`flex-1 py-1.5 transition-colors ${season === 'oct-dec' ? 'bg-[#007185] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Outubro-dezembro
                                        </button>
                                    </div>
                                    <DataRow label="Custo mensal de armazenamento por unidade" value={formatCurrency(fbaMonthlyStoragePrice)} />
                                    <InputRow label="Unidades de inventário médias armazenadas" value={fbaAvgInventory} onChange={setFbaAvgInventory} />
                                    <InputRow label="Unidades mensais estimadas vendidas" value={fbaEstSales} onChange={setFbaEstSales} />
                                    <DataRow label="Custo de armazenamento por unidade vendida" value={formatCurrency(fbaUnitStorage)} isBold />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbaOtherExpanded(!fbaOtherExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Outros custos {formatCurrency(fbaResults.taxAmount)}
                                    {fbaOtherExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbaOtherExpanded && (
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-600">Estimativa de IVA</span>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-12 text-center border rounded font-bold" />
                                        <span className="text-gray-400">%</span>
                                        <span className="font-bold">{formatCurrency(fbaResults.taxAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#d5dbdb] dashed pt-4 mt-4 space-y-2">
                            <InputRow label="Custo diverso" value={fbaMiscCost} onChange={setFbaMiscCost} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <InputRow label="Custo das mercadorias vendidas" value={cogs} onChange={setCogs} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <div className="pt-2">
                                <button className="bg-[#007185] text-white px-3 py-1 rounded text-xs font-bold hover:bg-[#005a6a]">Guardar</button>
                            </div>
                        </div>
                    </div>

                    {/* Results Overlay Footer */}
                    <div className="bg-[#f0f2f2] p-4 border-t border-[#d5dbdb] grid grid-cols-4 gap-2 text-center">
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Cost per unit</p><p className="font-bold text-[13px]">{formatCurrency(fbaResults.totalExpenses)}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Est. Sales 30d</p><p className="font-bold text-[13px]">{fbaEstSales}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Net Profit</p><p className={`font-bold text-[13px] ${fbaResults.netProfit >= 0 ? 'text-[#007185]' : 'text-red-600'}`}>{formatCurrency(fbaResults.netProfit)}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Net Margin</p><p className="font-bold text-[13px]">{fbaResults.netMargin.toFixed(2)}%</p></div>
                    </div>
                </div>

                {/* O SEU TIPO DE LOGÍSTICA (FBM) */}
                <div className="bg-white dark:bg-dark-900 rounded-sm border border-[#d5dbdb] shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="px-4 py-2 border-b border-[#d5dbdb] flex justify-between items-center bg-gray-50/50">
                        <h4 className="text-[15px] font-bold text-[#333] dark:text-gray-200">O seu tipo de logística</h4>
                        <X className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>

                    <div className="p-4 flex-1 space-y-4">
                        <InputRow label="Preço do produto" value={fbmPrice} onChange={setFbmPrice} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                        <InputRow label="Portes de envio" value={fbmShippingOut} onChange={setFbmShippingOut} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                        <DataRow label="Preço de venda" value={formatCurrency(fbmResults.totalSales)} isBold />

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbmFeesExpanded(!fbmFeesExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Taxas da Amazon {formatCurrency(fbmTotalAmazonFees)}
                                    {fbmFeesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbmFeesExpanded && (
                                <div className="space-y-0.5 animate-in slide-in-from-top-1">
                                    <InputRow label="Referral Fee" value={fbmReferral} onChange={setFbmReferral} />
                                    <InputRow label="Fixed Closing Fee" value={fbmFixedClosing} onChange={setFbmFixedClosing} />
                                    <InputRow label="Variable Closing Fee" value={fbmVariableClosing} onChange={setFbmVariableClosing} />
                                    <InputRow label="Taxa de serviços digitais" value={fbmDigitalServices} onChange={setFbmDigitalServices} />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <InputRow label="Custo de logística" value={fbmFulfilment} onChange={setFbmFulfilment} prefix={product?.currency === 'BRL' ? 'R$' : '€'} />
                            <button className="text-[#007185] text-xs hover:underline flex items-center gap-1 mb-2">Ver e editar a discriminação dos custos de logística <ChevronDown className="w-2.5 h-2.5" /></button>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbmStorageExpanded(!fbmStorageExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Custo de armazenamento {formatCurrency(fbmUnitStorage)}
                                    {fbmStorageExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                            {fbmStorageExpanded && (
                                <div className="space-y-3 animate-in slide-in-from-top-1">
                                    <p className="text-[11px] text-[#c45500] font-bold">Insira os seus custos de armazenamento para uma comparação mais precisa</p>
                                    <InputRow label="Custo mensal de armazenamento por unidade" value={fbmMonthlyStoragePrice} onChange={setFbmMonthlyStoragePrice} />
                                    <InputRow label="Unidades de inventário médias armazenadas" value={fbmAvgInventory} onChange={setFbmAvgInventory} />
                                    <InputRow label="Unidades mensais estimadas vendidas" value={fbmEstSales} onChange={setFbmEstSales} />
                                    <DataRow label="Custo de armazenamento por unidade vendida" value={formatCurrency(fbmUnitStorage)} isBold />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <button
                                onClick={() => setFbmOtherExpanded(!fbmOtherExpanded)}
                                className="flex items-center justify-between w-full text-sm font-bold text-[#333] py-1 mb-2"
                            >
                                <span className="flex items-center gap-1">
                                    Outros custos {formatCurrency(fbmResults.taxAmount)}
                                    {fbmOtherExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* FBM Footer Results */}
                    <div className="bg-[#f0f2f2] p-4 border-t border-[#d5dbdb] grid grid-cols-4 gap-2 text-center mt-auto">
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Cost per unit</p><p className="font-bold text-[13px]">{formatCurrency(fbmResults.totalExpenses)}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Est. Sales 30d</p><p className="font-bold text-[13px]">{fbmEstSales}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Net Proceeds</p><p className={`font-bold text-[13px] ${fbmResults.netProfit >= 0 ? 'text-[#007185]' : 'text-red-600'}`}>{formatCurrency(fbmResults.netProfit)}</p></div>
                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Net Margin</p><p className="font-bold text-[13px]">{fbmResults.netMargin.toFixed(2)}%</p></div>
                    </div>
                </div>

            </div>

            {/* Export Actions */}
            <div className="flex justify-center gap-4 mt-8">
                <button className="flex items-center gap-2 bg-white dark:bg-dark-800 hover:bg-gray-50 text-[#007185] px-10 py-3 rounded-lg text-base font-bold transition-all border border-[#d5dbdb] shadow-sm">
                    <Download className="w-5 h-5" />
                    Exportar PDF
                </button>
            </div>
        </div>
    );
};
