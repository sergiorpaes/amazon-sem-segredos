
import { estimateSales } from './sales-estimation.js';

function test() {
    console.log("--- Testing Category Mapping ---");
    const testCases = [
        { category: "Clothing, Shoes & Jewelry", bsr: 1264, expected: "Moda" },
        { category: "Men's Oxfords", bsr: 1, expected: "Moda" },
        { category: "Beauty & Personal Care", bsr: 500, expected: "Belleza" },
        { category: "Automotive Parts", bsr: 1000, expected: "Coche y moto" },
        { category: "Pet Supplies", bsr: 200, expected: "Produtos para mascotas" }
    ];

    testCases.forEach(tc => {
        try {
            const result = estimateSales(tc.bsr, tc.category);
            console.log(`Category: ${tc.category} -> Estimated Sales: ${result.estimatedSales} (Percentile: ${result.percentile})`);
        } catch (e) {
            console.log(`Error testing ${tc.category}: ${e.message}`);
        }
    });

    console.log("\n--- Testing Multiple Rankings Logic (Simulated) ---");
    const rankings = [
        { rank: 1264, displayGroup: "Clothing, Shoes & Jewelry" },
        { rank: 1, displayGroup: "Men's Oxfords" }
    ];

    let maxSales = -1;
    let bestEstimate = null;

    rankings.forEach(r => {
        const estimate = estimateSales(r.rank, r.displayGroup);
        console.log(`Rank: ${r.rank} in ${r.displayGroup} -> Sales: ${estimate.estimatedSales}`);
        if (estimate.estimatedSales > maxSales) {
            maxSales = estimate.estimatedSales;
            bestEstimate = estimate;
        }
    });

    if (bestEstimate) {
        console.log(`\nFinal Chosen Estimate: ${bestEstimate.estimatedSales} units/month`);
    } else {
        console.log("\nNo estimate found.");
    }
}

test();
