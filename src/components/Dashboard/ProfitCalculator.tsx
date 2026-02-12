import React, { useState } from 'react';
import { DollarSign, Info, Download, BarChart3, TrendingUp, Wallet, Sparkles } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { jsPDF } from 'jspdf';
import { getRecommendations } from '../../lib/strategicRecommendations';

export const ProfitCalculator: React.FC = () => {
    const { t, language } = useLanguage();

    // Profit Simulator State
    const [sellingPrice, setSellingPrice] = useState<number>(100);
    const [productCost, setProductCost] = useState<number>(30);
    const [taxRate, setTaxRate] = useState<number>(10);
    const [opExpenses, setOpExpenses] = useState<number>(1.50);
    const [adsCost, setAdsCost] = useState<number>(12);
    const [fbaFees, setFbaFees] = useState<number>(15);
    const [currency, setCurrency] = useState<string>('BRL');

    // Calculation Logic
    const taxAmount = sellingPrice * (taxRate / 100);
    const totalExpenses = fbaFees + productCost + taxAmount + opExpenses + adsCost;
    const netProfit = sellingPrice - totalExpenses;
    const netMargin = sellingPrice ? (netProfit / sellingPrice) * 100 : 0;
    const roi = productCost > 0 ? (netProfit / productCost) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dummyProduct = { title: 'Cálculo Manual', id: 'MANUAL', brand: 'N/A', category: 'N/A', currency, price: sellingPrice, fbaFees };
        const recommendations = getRecommendations(dummyProduct, {
            productCost, taxRate, opExpenses, adsCost, amazonFees: fbaFees, netProfit, netMargin, roi
        }, language);

        // Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Amazon Sem Segredos', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Relatório de Calculadora de Lucro Real', 105, 30, { align: 'center' });

        // Simulator Data
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Entradas da Simulação', 20, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Preço de Venda: ${formatCurrency(sellingPrice)}`, 20, 65);
        doc.text(`Taxas Amazon (FBA): ${formatCurrency(fbaFees)}`, 20, 72);
        doc.text(`Custo do Produto: ${formatCurrency(productCost)}`, 20, 79);
        doc.text(`Impostos (${taxRate}%): ${formatCurrency(taxAmount)}`, 20, 86);
        doc.text(`Gastos Operacionais: ${formatCurrency(opExpenses)}`, 20, 93);
        doc.text(`Investimento Ads/PPC: ${formatCurrency(adsCost)}`, 20, 100);

        // Results Box
        doc.setFillColor(245, 247, 250);
        doc.rect(15, 110, 180, 35, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`LUCRO LÍQUIDO: ${formatCurrency(netProfit)}`, 25, 122);
        doc.text(`MARGEM LÍQUIDA: ${netMargin.toFixed(1)}%`, 25, 130);
        doc.text(`ROI (RETORNO): ${roi.toFixed(1)}%`, 25, 138);

        // Recommendations
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise Estratégica', 20, 160);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yPos = 170;
        recommendations.forEach(rec => {
            const splitText = doc.splitTextToSize(`• ${rec}`, 170);
            doc.text(splitText, 20, yPos);
            yPos += (splitText.length * 5) + 2;
        });

        doc.save(`calculo-lucro-real.pdf`);
    };

    const getStatusColor = (val: number, threshold1: number, threshold2: number) => {
        if (val < threshold1) return 'text-red-500';
        if (val < threshold2) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-brand-600" />
                        {t('module.profit_calculator')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Calcule a viabilidade real do seu produto com todas as taxas e impostos.
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                        <option value="BRL">R$ (BRL)</option>
                        <option value="EUR">€ (EUR)</option>
                        <option value="USD">$ (USD)</option>
                    </select>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-gray-200 dark:border-dark-700 shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        {t('sim.export_pdf')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm space-y-5">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-dark-800 pb-3 mb-2">
                            <Wallet className="w-4 h-4 text-brand-500" />
                            Entradas de Valores
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço de Venda</label>
                            <input
                                type="number"
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('sim.product_cost')}</label>
                            <input
                                type="number"
                                value={productCost}
                                onChange={(e) => setProductCost(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('col.fba_fees')}</label>
                            <input
                                type="number"
                                value={fbaFees}
                                onChange={(e) => setFbaFees(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('sim.tax_rate')} (%)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 dark:bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                />
                                <span className="w-12 text-right font-bold text-gray-700 dark:text-gray-300">{taxRate}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">{t('sim.op_expenses')}</label>
                                <input
                                    type="number"
                                    value={opExpenses}
                                    onChange={(e) => setOpExpenses(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">{t('sim.ads_ppc')}</label>
                                <input
                                    type="number"
                                    value={adsCost}
                                    onChange={(e) => setAdsCost(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Big Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp className="w-20 h-20" />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('sim.net_profit')}</p>
                            <h4 className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {formatCurrency(netProfit)}
                            </h4>
                            <p className="text-xs text-gray-400 mt-2">Líquido por unidade</p>
                        </div>

                        <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BarChart3 className="w-20 h-20" />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('sim.net_margin')}</p>
                            <h4 className={`text-3xl font-black ${getStatusColor(netMargin, 10, 20)}`}>
                                {netMargin.toFixed(1)}%
                            </h4>
                            <p className="text-xs text-gray-400 mt-2">Sobre venda total</p>
                        </div>

                        <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Sparkles className="w-20 h-20" />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('sim.roi')}</p>
                            <h4 className={`text-3xl font-black ${getStatusColor(roi, 30, 100)}`}>
                                {roi.toFixed(0)}%
                            </h4>
                            <p className="text-xs text-gray-400 mt-2">Retorno s/ investimento</p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-brand-500" />
                            Detalhamento de Custos
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Custo de Aquisição</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(productCost)}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${(productCost / sellingPrice) * 100}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Taxas e Logística (FBA)</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(fbaFees)}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full" style={{ width: `${(fbaFees / sellingPrice) * 100}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Impostos ({taxRate}%)</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(taxAmount)}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full" style={{ width: `${(taxAmount / sellingPrice) * 100}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Marketing e Outros</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(adsCost + opExpenses)}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-400 h-full" style={{ width: `${((adsCost + opExpenses) / sellingPrice) * 100}%` }}></div>
                            </div>

                            <div className="pt-6 border-t border-gray-50 dark:border-dark-800 flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white">Total de Despesas</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
