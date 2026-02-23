import React, { useState } from 'react';
import { X, ExternalLink, Package, Trophy, DollarSign, BarChart3, Users, MessageSquare, Tag, Sparkles, Info, RefreshCw, Download, Search, Truck } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { translations } from '../../services/languageService';
import { jsPDF } from 'jspdf';
import { getRecommendations } from '../../lib/strategicRecommendations';
import { getSupplierLinks } from '../../lib/sourcingUtils';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // Using any for flexibility with ProductDisplay interface
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product }) => {
    const { t, language } = useLanguage();

    const [activeTab, setActiveTab] = useState<'details' | 'sourcing'>('details');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Reset state when product changes
    React.useEffect(() => {
        if (product?.id) {
            setAnalysisResult(null);
            setAnalysisError(null);
            setIsAnalyzing(false);
            setActiveTab('details');
        }
    }, [product?.id]);

    const MARKETPLACE_DOMAINS: Record<string, string> = {
        'ATVPDKIKX0DER': 'amazon.com',
        'A2EUQ1WTGCTBG2': 'amazon.ca',
        'A1AM78C64UM0Y8': 'amazon.com.mx',
        'A2Q3Y263D00KWC': 'amazon.com.br',
        'A1RKKUPIHCS9HS': 'amazon.es',
        'A1F83G8C2ARO7P': 'amazon.co.uk',
        'A13V1IB3VIYZZH': 'amazon.fr',
        'AMEN7PMS3EDWL': 'amazon.com.be',
        'A1805IZSGTT6HS': 'amazon.nl',
        'A1PA6795UKMFR9': 'amazon.de',
        'APJ6JRA9NG5V4': 'amazon.it',
        'A2NODRKZP88ZB9': 'amazon.se',
        'A1C3SOZRARQ6R3': 'amazon.pl',
        'A33AVAJ2PDY3EV': 'amazon.com.tr',
        'AE08WJ6YKNBMC': 'amazon.co.za',
        'ARBP9OOSHTCHU': 'amazon.eg',
        'A17E79C6D8DWNP': 'amazon.sa',
        'A2VIGQ35RCS4UG': 'amazon.ae',
        'A21TJRUUN4KGV': 'amazon.in',
        'A19VAU5U5O7RUS': 'amazon.sg',
        'A39IBJ37TRP1C6': 'amazon.com.au',
        'A1VC38T7YXB528': 'amazon.co.jp',
    };

    const getAmazonLink = () => {
        const domain = MARKETPLACE_DOMAINS[product.marketplace_id] || 'amazon.com';
        return `https://www.${domain}/dp/${product.id}`;
    };

    const handleAnalyzeCompetition = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const response = await fetch('/.netlify/functions/analyze-competition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asin: product.id,
                    marketplaceId: product.marketplace_id,
                    productTitle: product.title,
                    productBrand: product.brand,
                    productCategory: product.category,
                    productPrice: product.price,
                    productBsr: product.bsr,
                    productSales: product.sales,
                    productReviews: product.reviews,
                    productActiveSellers: product.activeSellers,
                    productCurrency: product.currency,
                    language: language // Pass current language
                })

            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || t('analyze.error'));

            setAnalysisResult(data);
        } catch (err: any) {
            console.error(err);
            setAnalysisError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen || !product) return null;

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return '-';
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: product.currency || 'USD' }).format(amount);
    };

    const formatNumber = (num: number | null | undefined) => {
        return num ? num.toLocaleString() : '-';
    };

    const supplierLinks = getSupplierLinks(product.title, product.brand);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/50">
                    <div className="pr-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand-100 text-brand-800 uppercase tracking-wide">
                                {t(`category.${product.category}`) || product.category || t('common.product')}
                            </span>
                            {product.bsr && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                    #{product.bsr.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{product.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {product.brand || t('modal.unknown_brand')}
                            </span>
                            <span className="font-mono text-xs bg-gray-200 dark:bg-dark-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 select-all">
                                {product.id}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-gray-100 dark:border-dark-700">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {t('modal.details')}
                    </button>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'sourcing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} flex items-center gap-2`}
                    >
                        <Search className="w-4 h-4" />
                        {t('sourcing.title')}
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Image Section */}
                                <div className="w-full md:w-1/3 flex flex-col gap-4">
                                    <div className="aspect-square bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl p-2 flex items-center justify-center shadow-sm">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Package className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                                        )}
                                    </div>

                                    <a
                                        href={getAmazonLink()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#ffad33] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-100 text-sm"
                                    >
                                        {t('modal.view_amazon')}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                {/* Details Grid */}
                                <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                                            <DollarSign className="w-3 h-3" /> {t('modal.price')}
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.price)}</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase mb-1">
                                            <BarChart3 className="w-3 h-3" /> {t('modal.est_sales')}
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-400">{formatNumber(product.sales)}</div>
                                        <div className="text-xs text-emerald-600 dark:text-emerald-500/80 font-medium mt-1">{t('modal.units_month')}</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 col-span-2">
                                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase mb-1">
                                            <DollarSign className="w-3 h-3" /> {t('modal.est_revenue')}
                                        </div>
                                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-400">{formatCurrency(product.revenue)}</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                                            <Users className="w-3 h-3" /> {t('modal.sellers')}
                                        </div>
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(product.activeSellers)}</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                                            <Tag className="w-3 h-3" /> {t('modal.fba_fees')}
                                        </div>
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.fbaFees)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="pt-6 border-t border-gray-100 dark:border-dark-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-brand-500" />
                                        {t('analyze.modal_title')}
                                    </h3>
                                    {!analysisResult && !isAnalyzing && (
                                        <div className="flex flex-col items-end gap-1">
                                            <button onClick={handleAnalyzeCompetition} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                                                <BarChart3 className="w-4 h-4" />
                                                {t('analyze.button')}
                                            </button>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                {t('analyze.credits_info')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Analysis Loader */}
                                {isAnalyzing && (
                                    <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-xl p-6 text-center animate-pulse">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent mb-3"></div>
                                        <p className="text-brand-800 dark:text-brand-400 font-medium">{t('analyze.processing')}</p>
                                    </div>
                                )}

                                {analysisResult && (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-5">
                                                <h4 className="text-red-800 dark:text-red-400 font-bold text-sm uppercase mb-3 flex items-center gap-2"><X className="w-4 h-4" /> {t('analyze.weaknesses')}</h4>
                                                <ul className="space-y-2">
                                                    {analysisResult.weaknesses.map((w: string, i: number) => <li key={i} className="text-sm text-red-700 dark:text-red-300 flex gap-2"><span className="shrink-0">•</span>{w}</li>)}
                                                </ul>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5">
                                                <h4 className="text-emerald-800 dark:text-emerald-400 font-bold text-sm uppercase mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t('analyze.improvements')}</h4>
                                                <ul className="space-y-2">
                                                    {analysisResult.improvements.map((m: string, i: number) => <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex gap-2"><span className="shrink-0">✓</span>{m}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                                    <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900 dark:text-blue-400">{t('sourcing.find_suppliers')}</h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-500/80 leading-tight">{t('sourcing.desc')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(supplierLinks).map(([key, url]) => (
                                    <a
                                        key={key}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 bg-white dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-dark-800 rounded-lg flex items-center justify-center font-bold text-brand-600 dark:text-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors capitalize">
                                                {key[0]}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white">{t(`sourcing.${key}`)}</h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{url.split('/')[2]}</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                                    </a>
                                ))}
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-5">
                                <h4 className="text-amber-800 dark:text-amber-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> {t('sourcing.estimated_cost')}
                                </h4>
                                <div className="text-3xl font-black text-amber-900 dark:text-amber-400 mb-2">
                                    ~ {formatCurrency((product.price || 100) * 0.3)} <span className="text-sm font-normal text-amber-700 dark:text-amber-500">/ {t('common.unit')}</span>
                                </div>
                                <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed italic">
                                    {t('sourcing.rule_of_thumb')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50 text-center text-xs text-gray-400 dark:text-gray-500">
                    {t('modal.footer_disclaimer')}
                </div>
            </div>
        </div>
    );
};
