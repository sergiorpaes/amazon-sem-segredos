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
 * Calculates FBA Fees based on price and physical attributes.
 */
export function calculateFBAFees(price: number, dimensions?: Dimensions, weight?: Weight, category?: string): FBAResult {
    // 1. Referral Fee (Dynamic based on Category and Price)
    // 12% for Major Appliances and Electronics (> R$ 1000 or > 150 EUR)
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

    // 2. Fulfillment Fee (Simplified Tiered Logic for Spain)
    // Prices in EUR cents
    let fulfillmentFee = 0;

    if (!dimensions || !weight) {
        // Fallback: 30% of price total if dimensions are missing
        const totalEstimate = Math.round(price * 100 * 0.30);
        return {
            totalFees: totalEstimate,
            referralFee: referralFee,
            fulfillmentFee: Math.max(0, totalEstimate - referralFee),
            isEstimate: true
        };
    }

    // Convert to target units (cm and kg)
    const unitLower = dimensions.unit?.toUpperCase() || '';
    const cm_l = unitLower === 'INCHES' ? dimensions.length * 2.54 : dimensions.length;
    const cm_w = unitLower === 'INCHES' ? dimensions.width * 2.54 : dimensions.width;
    const cm_h = unitLower === 'INCHES' ? dimensions.height * 2.54 : dimensions.height;

    const weightUnitLower = weight.unit?.toUpperCase() || '';
    const kg = weightUnitLower === 'POUNDS' ? weight.value * 0.453592 : weight.value;

    // Simple Tier Logic for Amazon (Simplified for approximation)
    if (cm_l <= 35 && cm_w <= 25 && cm_h <= 2 && kg <= 0.1) {
        fulfillmentFee = 250; // 2.50 EUR
    } else if (cm_l <= 45 && cm_w <= 34 && cm_h <= 26 && kg <= 1) {
        fulfillmentFee = 450; // 4.50 EUR
    } else if (kg <= 2) {
        fulfillmentFee = 650; // 6.50 EUR tier
    } else {
        fulfillmentFee = 750 + Math.floor(kg * 50); // Base 7.50 + weight surcharge
    }

    // --- FBA Sanity Check (Toys Logic) ---
    // For 'Brinquedos' under 2kg, Fulfillment Fee must not exceed 40% of the price
    const isToys = category && (category.includes('Brinquedos') || category.includes('Toys'));
    if (isToys && kg < 2) {
        const cap = Math.round(price * 100 * 0.40);
        if (fulfillmentFee > cap) {
            fulfillmentFee = cap;
        }
    }

    return {
        totalFees: referralFee + fulfillmentFee,
        referralFee,
        fulfillmentFee,
        isEstimate: false
    };
}
