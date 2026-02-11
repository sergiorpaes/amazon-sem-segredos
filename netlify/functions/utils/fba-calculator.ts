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
export function calculateFBAFees(price: number, dimensions?: Dimensions, weight?: Weight): FBAResult {
    // 1. Referral Fee (Standard 15%)
    const referralFee = Math.round(price * 0.15);

    // 2. Fulfillment Fee (Simplified Tiered Logic for Spain)
    // Prices in EUR cents
    let fulfillmentFee = 0;
    let isEstimate = false;

    if (!dimensions || !weight) {
        // Fallback: 30% of price total if dimensions are missing
        const totalEstimate = Math.round(price * 0.30);
        return {
            totalFees: totalEstimate,
            referralFee: referralFee,
            fulfillmentFee: Math.max(0, totalEstimate - referralFee),
            isEstimate: true
        };
    }

    // Convert to target units (cm and kg)
    const cm_l = dimensions.unit === 'INCHES' ? dimensions.length * 2.54 : dimensions.length;
    const cm_w = dimensions.unit === 'INCHES' ? dimensions.width * 2.54 : dimensions.width;
    const cm_h = dimensions.unit === 'INCHES' ? dimensions.height * 2.54 : dimensions.height;
    const kg = weight.unit === 'POUNDS' ? weight.value * 0.453592 : weight.value;

    // Simple Tier Logic for Amazon ES (Simplified for approximation)
    // Small (Envelope): < 35x25x2 cm, < 100g -> ~2.50 EUR
    // Standard: < 45x34x26 cm, < 1kg -> ~4.50 EUR
    // Large: Everything else -> ~7.50 EUR+

    if (cm_l <= 35 && cm_w <= 25 && cm_h <= 2 && kg <= 0.1) {
        fulfillmentFee = 250; // 2.50 EUR
    } else if (cm_l <= 45 && cm_w <= 34 && cm_h <= 26 && kg <= 1) {
        fulfillmentFee = 450; // 4.50 EUR
    } else {
        fulfillmentFee = 750 + Math.floor(kg * 50); // Base 7.50 + weight surcharge
    }

    return {
        totalFees: referralFee + fulfillmentFee,
        referralFee,
        fulfillmentFee,
        isEstimate: false
    };
}
