
const bsrTable2025: Record<string, Record<string, number>> = {
    "Alimentación y bebidas": { top1: 7655, top2: 15310, top3: 22965, top5: 38275, top10: 76550 },
    "Apps y Juegos": { top1: 7501, top2: 15001, top3: 22502, top5: 37503, top10: 75007 },
    "Bebé": { top1: 44581, top2: 89162, top3: 133743, top5: 222904, top10: 445809 },
    "Belleza": { top1: 88000, top2: 176001, top3: 264001, top5: 440001, top10: 880003 },
    "Bricolaje y herramientas": { top1: 292192, top2: 584385, top3: 876577, top5: 1460961, top10: 2921923 },
    "CDs y vinilos": { top1: 23292, top2: 46585, top3: 69877, top5: 116461, top10: 232923 },
    "Coche y moto": { top1: 292876, top2: 585751, top3: 878627, top5: 1464378, top10: 2928757 },
    "Deportes y aire libre": { top1: 159414, top2: 318827, top3: 478241, top5: 797068, top10: 1594137 },
    "Electrónica": { top1: 199266, top2: 398532, top3: 597798, top5: 996330, top10: 1992659 },
    "Grandes electrodomésticos": { top1: 9686, top2: 19373, top3: 29059, top5: 48432, top10: 96863 },
    "Hogar y cocina": { top1: 905742, top2: 1811483, top3: 2717225, top5: 4528708, top10: 9057416 },
    "Iluminación": { top1: 58561, top2: 117121, top3: 175682, top5: 292803, top10: 585605 },
    "Industria, empresas y ciencia": { top1: 111037, top2: 222073, top3: 333110, top5: 555183, top10: 1110367 },
    "Informática": { top1: 75973, top2: 151946, top3: 227919, top5: 379866, top10: 759731 },
    "Instrumentos musicales": { top1: 33167, top2: 66335, top3: 99502, top5: 165837, top10: 331675 },
    "Jardín": { top1: 172328, top2: 344655, top3: 516983, top5: 861638, top10: 1723276 },
    "Juguetes y juegos": { top1: 78457, top2: 156914, top3: 235372, top5: 392286, top10: 784572 },
    "Libros": { top1: 307669, top2: 615339, top3: 923008, top5: 1538347, top10: 3076694 },
    "Moda": { top1: 955731, top2: 1911461, top3: 2867192, top5: 4778653, top10: 9557307 },
    "Música Digital": { top1: 51776, top2: 103553, top3: 155329, top5: 258882, top10: 517763 },
    "Oficina y papelería": { top1: 73135, top2: 146270, top3: 219405, top5: 365675, top10: 731350 },
    "Otros Productos": { top1: 110, top2: 221, top3: 331, top5: 551, top10: 1103 },
    "Películas y TV": { top1: 9803, top2: 19607, top3: 29410, top5: 49017, top10: 98034 },
    "Prime Video": { top1: 750, top2: 1500, top3: 2249, top5: 3749, top10: 7498 },
    "Productos Handmade": { top1: 3081, top2: 6162, top3: 9243, top5: 15406, top10: 30811 },
    "Productos para mascotas": { top1: 73750, top2: 147500, top3: 221251, top5: 368751, top10: 737502 },
    "Salud y cuidado personal": { top1: 72763, top2: 145527, top3: 218290, top5: 363817, top10: 727634 },
    "Tienda Kindle": { top1: 12976, top2: 25952, top3: 38928, top5: 64879, top10: 129758 },
    "Videojuegos": { top1: 5305, top2: 10610, top3: 15915, top5: 26526, top10: 53051 }
};

/**
 * Estimates monthly sales based on BSR and Category for Spain 2025.
 */
export function estimateSales(bsr: number, category: string): { estimatedSales: number; percentile: string | undefined; categoryTotal: number } {
    // 1. Resolve normalized category name (mapping raw SP-API names to our census names)
    let normalizedCategory = "Otros Productos";

    // Best-effort mapping for common SP-API values
    if (category.includes("Belleza") || category.includes("Beauty")) normalizedCategory = "Belleza";
    else if (category.includes("Electrónica") || category.includes("Electronics")) normalizedCategory = "Electrónica";
    else if (category.includes("Hogar") || category.includes("Kitchen") || category.includes("Home")) normalizedCategory = "Hogar y cocina";
    else if (category.includes("Alimentación") || category.includes("Grocery")) normalizedCategory = "Alimentación y bebidas";
    else if (category.includes("Juguetes") || category.includes("Toys")) normalizedCategory = "Juguetes y juegos";
    else if (category.includes("Bebé") || category.includes("Baby")) normalizedCategory = "Bebé";
    else if (category.includes("Deportes") || category.includes("Sport")) normalizedCategory = "Deportes y aire libre";
    else if (category.includes("Ropa") || category.includes("Moda") || category.includes("Apparel")) normalizedCategory = "Moda";
    else if (category.includes("Bricolaje") || category.includes("Tools") || category.includes("DIY")) normalizedCategory = "Bricolaje y herramientas";
    else if (category.includes("Informática") || category.includes("PC")) normalizedCategory = "Informática";
    else if (category.includes("Mascotas") || category.includes("Pet")) normalizedCategory = "Productos para mascotas";
    else if (category.includes("Salud") || category.includes("Personal Care")) normalizedCategory = "Salud y cuidado personal";
    else if (category.includes("Libros") || category.includes("Books")) normalizedCategory = "Libros";
    else if (category.includes("Jardín") || category.includes("Garden")) normalizedCategory = "Jardín";
    else if (category.includes("Iluminación") || category.includes("Lighting")) normalizedCategory = "Iluminación";
    else if (category.includes("Oficina") || category.includes("Office")) normalizedCategory = "Oficina y papelería";
    else if (category.includes("Grandes electrodomésticos") || category.includes("Major Appliances")) normalizedCategory = "Grandes electrodomésticos";

    const census = bsrTable2025[normalizedCategory] || bsrTable2025["Otros Productos"];

    // 2. Determine Percentile and Estimate Units
    // Ranges based on user logic:
    // Top 1%: 300 - 2500 (Standard)
    // Major Appliances: Conservative curve (Top 1% capped at 800)
    const top1Max = normalizedCategory === "Grandes electrodomésticos" ? 800 : 2500;

    if (bsr <= census.top1) {
        // Top 1% - Interpolate between 300 and Max
        const ratio = (census.top1 - bsr) / census.top1;
        const estimated = Math.floor(300 + (ratio * (top1Max - 300)));
        return { estimatedSales: estimated, percentile: "1%", categoryTotal: census.top10 };
    }

    if (bsr <= census.top3) {
        // Top 3% - Interpolate between 100 and 299
        const range = census.top3 - census.top1;
        const offset = bsr - census.top1;
        const ratio = (range - offset) / range;
        const estimated = Math.floor(100 + (ratio * 199));
        return { estimatedSales: estimated, percentile: "3%", categoryTotal: census.top10 };
    }

    if (bsr <= census.top10) {
        // Top 10% - Interpolate between 10 and 45
        const range = census.top10 - census.top3;
        const offset = bsr - census.top3;
        const ratio = (range - offset) / range;
        const estimated = Math.floor(10 + (ratio * 35));
        return { estimatedSales: estimated, percentile: "10%", categoryTotal: census.top10 };
    }

    // Outside Top 10%
    return { estimatedSales: 5, percentile: undefined, categoryTotal: census.top10 }; // Show as < 10 in UI
}
