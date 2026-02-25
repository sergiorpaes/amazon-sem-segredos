
import { estimateSales } from './sales-estimation.js';

function test() {
    console.log("--- Testing Logarithmic Curve & Marketplace Scaling ---");

    // Case from user: B0BZC3R77L (Men's Oxfords / Clothing)
    // US Marketplace, Rank 1264
    const usCase = estimateSales(1264, "Clothing, Shoes & Jewelry", 'ATVPDKIKX0DER');
    console.log(`US Category: Clothing, BSR: 1264 -> Estimated Sales: ${usCase.estimatedSales} (Percentile: ${usCase.percentile})`);

    // US Marketplace, Rank 1 (Sub-category - simulate root category for test)
    const usRootRank1 = estimateSales(1, "Men's Oxfords", 'ATVPDKIKX0DER');
    console.log(`US Sub-category: Men's Oxfords, BSR: 1 -> Estimated Sales: ${usRootRank1.estimatedSales}`);

    // Brazil Marketplace, same BSR
    const brCase = estimateSales(1264, "Clothing, Shoes & Jewelry", 'A2Q3Y263D00KWC');
    console.log(`BR Category: Clothing, BSR: 1264 -> Estimated Sales: ${brCase.estimatedSales} (Scaled: 0.3x)`);

    console.log("\n--- Comparison with previous linear logic ---");
    console.log("Old logic estimated ~2400 for BSR 1264 in US Moda.");
    console.log(`New logic estimates ~${usCase.estimatedSales} (much closer to the '400+' bought metric).`);

    console.log("\n--- Testing High BSR (Tail) ---");
    const highBsr = estimateSales(50000, "Moda", 'ATVPDKIKX0DER');
    console.log(`US BSR: 50000 -> Estimated Sales: ${highBsr.estimatedSales} (Should be very low)`);
}

test();
