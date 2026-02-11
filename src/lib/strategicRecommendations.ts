
export interface SimulatorData {
    productCost: number;
    taxRate: number;
    opExpenses: number;
    adsCost: number;
    amazonFees: number;
    netProfit: number;
    netMargin: number;
    roi: number;
}

export const getRecommendations = (product: any, data: SimulatorData, language: string): string[] => {
    const recommendations: string[] = [];

    // 1. Margin-based recommendations
    if (data.netMargin < 10) {
        if (language === 'pt') {
            recommendations.push("Sua margem está abaixo de 10%. Considere reduzir as 'Despesas Operacionais' (preparação/embalagem) para torná-la saudável.");
        } else if (language === 'es') {
            recommendations.push("Su margen está por debajo del 10%. Considere reducir los 'Gastos Operativos' para mejorar la rentabilidad.");
        } else {
            recommendations.push("Your margin is below 10%. Consider reducing 'Operational Expenses' to improve profitability.");
        }
    }

    // 2. PPC/Ads Recommendations
    const adsPercentage = (data.adsCost / (product.price || 1)) * 100;
    const isTop1Percent = product.percentile === '1%';

    if (isTop1Percent && adsPercentage > 10) {
        if (language === 'pt') {
            recommendations.push("Seu produto já está no Top 1%. Você pode tentar reduzir o lance de PPC gradualmente para aumentar seu lucro orgânico.");
        } else if (language === 'es') {
            recommendations.push("Su producto ya está en el Top 1%. Intente reducir la puja de PPC para maximizar el beneficio orgánico.");
        } else {
            recommendations.push("Your product is already in the Top 1%. Target a lower PPC cost to maximize organic profit.");
        }
    }

    if (adsPercentage > 25) {
        if (language === 'pt') {
            recommendations.push("O investimento em Ads está muito alto (>25%). Verifique se suas palavras-chave estão convertendo e negative termos irrelevantes.");
        } else {
            recommendations.push("Your Ads investment is very high (>25%). Audit your keywords and negative irrelevant terms.");
        }
    }

    // 3. FBA Fees Recommendations
    const feesPercentage = (data.amazonFees / (product.price || 1)) * 100;
    if (feesPercentage > 40) {
        if (language === 'pt') {
            recommendations.push("As taxas da Amazon superam 40% do preço. Veja se é possível otimizar as dimensões do produto para cair em uma categoria de frete menor.");
        } else {
            recommendations.push("Amazon fees are >40% of the price. Check if you can optimize product packaging to fit in a smaller shipping tier.");
        }
    }

    // 4. ROI Recommendations
    if (data.roi < 30 && data.roi > 0) {
        if (language === 'pt') {
            recommendations.push("O ROI está baixo (<30%). Tente renegociar com seu fornecedor ou buscar um novo fabricante para diminuir o custo unitário.");
        } else {
            recommendations.push("ROI is low (<30%). Try renegotiating with your supplier to lower the unit cost.");
        }
    }

    // Default recommendation if none added
    if (recommendations.length === 0) {
        if (language === 'pt') {
            recommendations.push("Produto com ótimas métricas! Foque em manter o estoque e monitorar novos concorrentes.");
        } else {
            recommendations.push("Excellent product metrics! Focus on inventory management and monitoring competitors.");
        }
    }

    return recommendations;
};
