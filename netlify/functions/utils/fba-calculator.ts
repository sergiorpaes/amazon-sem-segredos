/**
 * FBA Fee Calculator Logic for Amazon ES (Spain).
 * Based on standard Referral and Fulfillment tiers.
 */

interface Dimensions {
    height: number;
    width: number;
    length: number;
    unit: string;
}

interface Weight {
    value: number;
    unit: string;
}

export interface FBAResult {
    totalFees: number; // in cents
    referralFee: number; // in cents
    fulfillmentFee: number; // in cents
    isEstimate: boolean;
}

/**
 * Calculates FBA Fees based on price, physical attributes and Marketplace.
 */
export function calculateFBAFees(price: number, marketplaceId: string, dimensions?: Dimensions, weight?: Weight, category?: string): FBAResult {
    // 1. Referral Fee (Dynamic based on Category and Price)
    // 12% for Major Appliances and Electronics (> 150 EUR/USD)
    // 15% for general categories
    let rate = 0.15;
    const isHighValueTech = category && (
        category.includes('Electrónica') ||
        category.includes('Electronics') ||
        category.includes('Grandes electrodomésticos') ||
        category.includes('Major Appliances')
    );

    if (isHighValueTech && price > 150) {
        rate = 0.12;
    }

    const referralFee = Math.round(price * 100 * rate);

    // 2. Fulfillment Fee (Multi-Marketplace Tiered Logic)
    let fulfillmentFee = 0;

    // --- Fallback if dims/weight missing ---
    if (!dimensions || !weight) {
        let fallbackRate = 0.25;
        if (marketplaceId === 'A2Q3Y263D00KWC') fallbackRate = 0.20; // BR
        if (price > 1000) fallbackRate = 0.12;

        const totalEstimate = Math.round(price * 100 * fallbackRate);
        return {
            totalFees: referralFee + Math.max(0, totalEstimate - referralFee),
            referralFee: referralFee,
            fulfillmentFee: Math.max(0, totalEstimate - referralFee),
            isEstimate: true
        };
    }

    // --- Unit Normalization ---
    const unitUpper = dimensions.unit?.toUpperCase() || '';
    let cm_l = dimensions.length;
    let cm_w = dimensions.width;
    let cm_h = dimensions.height;

    if (unitUpper.includes('INCH')) { cm_l *= 2.54; cm_w *= 2.54; cm_h *= 2.54; }
    else if (unitUpper.includes('MILLI') || unitUpper === 'MM') { cm_l /= 10; cm_w /= 10; cm_h /= 10; }

    const weightUnitUpper = weight.unit?.toUpperCase() || '';
    let kg = weight.value;
    if (weightUnitUpper.includes('POUND') || weightUnitUpper === 'LB' || weightUnitUpper === 'LBS') kg *= 0.453592;
    else if (weightUnitUpper.includes('OUNCE') || weightUnitUpper === 'OZ') kg *= 0.0283495;
    else if (weightUnitUpper.includes('GRAM') || weightUnitUpper === 'G' || weightUnitUpper === 'GR') kg /= 1000;

    const grams = kg * 1000;

    // --- Regional Tier Logic ---
    if (marketplaceId === 'A2Q3Y263D00KWC') { // BRAZIL (R$)
        if (kg <= 0.5) fulfillmentFee = 1390;
        else if (kg <= 1) fulfillmentFee = 1690;
        else if (kg <= 2) fulfillmentFee = 1990;
        else fulfillmentFee = 2490 + (Math.max(0, Math.ceil(kg - 2)) * 200);
    } 
    else if (marketplaceId === 'ATVPDKIKX0DER') { // USA ($)
        if (kg <= 0.22) fulfillmentFee = 322;
        else if (kg <= 0.45) fulfillmentFee = 440;
        else if (kg <= 1) fulfillmentFee = 550;
        else fulfillmentFee = 650 + (Math.max(0, Math.ceil(kg - 1)) * 100);
    }
    else { // EUROPE / SPAIN (EUR) - IMPROVED 2024 TIERS
        const maxDim = Math.max(cm_l, cm_w, cm_h);
        const minDim = Math.min(cm_l, cm_w, cm_h);
        const midDim = cm_l + cm_w + cm_h - maxDim - minDim;

        if (maxDim <= 33 && midDim <= 23 && minDim <= 2.5 && kg <= 0.1) {
            fulfillmentFee = 281; // Envelope Standard 250g (min tier)
        } else if (maxDim <= 45 && midDim <= 34 && minDim <= 26) {
            // Standard Parcel Tiers
            if (kg <= 0.25) fulfillmentFee = 332;
            else if (kg <= 0.5) fulfillmentFee = 360; // Matches user screenshot (B0DLKGLBPG)
            else if (kg <= 1) fulfillmentFee = 454;
            else if (kg <= 2) fulfillmentFee = 592;
            else fulfillmentFee = 750 + (Math.max(0, Math.ceil(kg - 2)) * 120);
        } else {
            fulfillmentFee = 950 + (Math.max(0, Math.ceil(kg - 2)) * 150); // Oversized
        }
    }

    // Secondary safety: Never charge more than 50% of price for standard items
    if (kg < 5 && fulfillmentFee > (price * 100 * 0.50)) {
        fulfillmentFee = Math.round(price * 100 * 0.50);
    }

    return {
        totalFees: referralFee + fulfillmentFee,
        referralFee,
        fulfillmentFee,
        isEstimate: false
    };
}

