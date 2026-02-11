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

    // --- Robust Unit Conversion (Exhaustive) ---
    const unitUpper = dimensions.unit?.toUpperCase() || '';
    let cm_l = dimensions.length;
    let cm_w = dimensions.width;
    let cm_h = dimensions.height;

    if (unitUpper.includes('INCH')) {
        cm_l *= 2.54; cm_w *= 2.54; cm_h *= 2.54;
    } else if (unitUpper.includes('MILLI') || unitUpper === 'MM') {
        cm_l /= 10; cm_w /= 10; cm_h /= 10;
    }

    const weightUnitUpper = weight.unit?.toUpperCase() || '';
    let kg = weight.value;

    if (weightUnitUpper.includes('POUND') || weightUnitUpper === 'LB' || weightUnitUpper === 'LBS') {
        kg *= 0.453592;
    } else if (weightUnitUpper.includes('OUNCE') || weightUnitUpper === 'OZ') {
        kg *= 0.0283495;
    } else if (weightUnitUpper.includes('GRAM') || weightUnitUpper === 'G' || weightUnitUpper === 'GR') {
        kg /= 1000;
    }

    // --- Tier Logic (Simplified but standard) ---
    if (cm_l <= 35 && cm_w <= 25 && cm_h <= 2 && kg <= 0.1) {
        fulfillmentFee = 250; // Small Envelope
    } else if (cm_l <= 45 && cm_w <= 34 && cm_h <= 26 && kg <= 1) {
        fulfillmentFee = 450; // Standard
    } else if (kg <= 2 && cm_l <= 45 && cm_w <= 34 && cm_h <= 26) {
        fulfillmentFee = 650; // Standard 2kg
    } else {
        // Oversized or Heavy
        fulfillmentFee = 950 + Math.max(0, Math.floor((kg - 2) * 100)); // Base + surcharge
    }

    // --- FBA Sanity Check (Toys & Safety Cap) ---
    const normCategory = (category || '').toLowerCase();
    const isToys = normCategory.includes('brinquedo') || normCategory.includes('toy');

    if (isToys && kg < 2) {
        const cap = Math.round(price * 100 * 0.40);
        if (fulfillmentFee > cap || fulfillmentFee > 1800) { // Max 18.00 for small toys
            fulfillmentFee = Math.min(fulfillmentFee, cap);
        }
    }

    // Secondary safety: Never charge more than 60% of price for ANY standard item under 5kg
    if (kg < 5 && fulfillmentFee > (price * 100 * 0.60)) {
        fulfillmentFee = Math.round(price * 100 * 0.60);
    }

    return {
        totalFees: referralFee + fulfillmentFee,
        referralFee,
        fulfillmentFee,
        isEstimate: false
    };
}
