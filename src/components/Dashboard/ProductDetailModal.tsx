import React, { useState } from 'react';
import { X, ExternalLink, Package, Trophy, DollarSign, BarChart3, Users, MessageSquare, Tag, Sparkles } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { translations } from '../../services/languageService';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // Using any for flexibility with ProductDisplay interface
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product }) => {
    const { language } = useLanguage();
    // Helper to access translations safely
    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const handleAnalyzeCompetition = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const response = await fetch('/.netlify/functions/analyze-competition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asin: product.id, marketplaceId: product.marketplace_id })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to analyze');

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand-100 text-brand-800 uppercase tracking-wide">
                                {t(product.category) || product.category || 'Product'}
                            </span>
                            {product.bsr && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                    #{product.bsr.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-3 leading-snug">{product.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {product.brand || t('modal.unknown_brand')}
                            </span>
                            <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 select-all">
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

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Image Section */}
                        <div className="w-full md:w-1/3 flex flex-col gap-4">
                            <div className="aspect-square bg-white border border-gray-100 rounded-xl p-2 flex items-center justify-center shadow-sm">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <Package className="w-12 h-12 text-gray-300" />
                                )}
                            </div>

                            <a
                                href={`https://www.amazon.com/dp/${product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#ffad33] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-100"
                            >
                                {t('modal.view_amazon')}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Details Grid */}
                        <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                    <DollarSign className="w-3 h-3" /> {t('modal.price')}
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(product.price)}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase mb-1">
                                    <BarChart3 className="w-3 h-3" /> {t('modal.est_sales')}
                                </div>
                                <div className="text-2xl font-bold text-emerald-900">{formatNumber(product.sales)}</div>
                                <div className="text-xs text-emerald-600 font-medium mt-1">{t('modal.units_month')}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 col-span-2">
                                <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase mb-1">
                                    <DollarSign className="w-3 h-3" /> {t('modal.est_revenue')}
                                </div>
                                <div className="text-3xl font-bold text-blue-900">{formatCurrency(product.revenue)}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                    <Users className="w-3 h-3" /> {t('modal.sellers')}
                                </div>
                                <div className="text-xl font-bold text-gray-900">{formatNumber(product.activeSellers)}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                    <MessageSquare className="w-3 h-3" /> {t('modal.reviews')}
                                </div>
                                <div className="text-xl font-bold text-gray-900">{formatNumber(product.reviews)}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                    <Tag className="w-3 h-3" /> {t('modal.fba_fees')}
                                </div>
                                <div className="text-xl font-bold text-gray-900">{formatCurrency(product.fbaFees)}</div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                    <Trophy className="w-3 h-3" /> {t('modal.score')}
                                </div>
                                <div className="text-xl font-bold text-gray-900">{product.score || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Competition Analysis Section */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-brand-500" />
                                {t('analyze.modal_title')}
                            </h3>
                            {!analysisResult && !isAnalyzing && (
                                <button
                                    onClick={handleAnalyzeCompetition}
                                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    {t('analyze.button')}
                                </button>
                            )}
                        </div>

                        {isAnalyzing && (
                            <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 text-center animate-pulse">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent mb-3"></div>
                                <p className="text-brand-800 font-medium">{t('analyze.processing')}</p>
                                <p className="text-xs text-brand-600 mt-1">{t('analyze.credits_info')}</p>
                            </div>
                        )}

                        {analysisError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
                                <span className="p-1 bg-red-100 rounded-full">⚠️</span>
                                {analysisError}
                            </div>
                        )}

                        {analysisResult && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                                        <h4 className="text-red-800 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <X className="w-4 h-4" /> {t('analyze.weaknesses')}
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.weaknesses.map((w: string, i: number) => (
                                                <li key={i} className="text-sm text-red-700 flex gap-2">
                                                    <span className="shrink-0 font-bold">•</span>
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                                        <h4 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> {t('analyze.improvements')}
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.improvements.map((m: string, i: number) => (
                                                <li key={i} className="text-sm text-emerald-700 flex gap-2">
                                                    <span className="shrink-0 font-bold">✓</span>
                                                    {m}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 italic">
                                    {analysisResult.summary}
                                </div>

                                {analysisResult.rawReviews && analysisResult.rawReviews.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-gray-400" />
                                            {t('analyze.recent_reviews')}
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {analysisResult.rawReviews.map((review: string, i: number) => (
                                                <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 text-xs text-gray-600 line-clamp-3 hover:line-clamp-none transition-all">
                                                    "{review}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                    {t('modal.footer_disclaimer')}
                </div>
            </div>
        </div>
    );
};
