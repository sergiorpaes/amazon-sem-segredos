// Version: 1.0.1 - Individual Pricing API Switch
import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits, isAlreadyConsumed } from '../../src/lib/credits';
import { getCachedProduct, cacheProduct } from './utils/product-cache';
import { estimateSales } from './utils/sales-estimation';
import { calculateFBAFees } from './utils/fba-calculator';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

const REGION_ENDPOINTS: Record<string, string> = {
    'NA': 'https://sellingpartnerapi-na.amazon.com',
    'EU': 'https://sellingpartnerapi-eu.amazon.com',
    'FE': 'https://sellingpartnerapi-fe.amazon.com'
};

/**
 * Helper to determine the best sales estimate from multiple rankings.
 */
function getBestSalesEstimate(item: any, marketplaceId: string) {
    const allRanks = item.salesRanks?.[0]?.displayGroupRanks || [];
    const rootCategory = item.summaries?.[0]?.websiteDisplayGroupName || '';

    let bestEstimate = { estimatedSales: 0, percentile: undefined as string | undefined, categoryTotal: 0, bestBsr: undefined as number | undefined };

    if (allRanks.length > 0) {
        let maxEstimate = -1;
        for (const rankObj of allRanks) {
            const isRoot = rankObj.displayGroup === rootCategory;
            const estimate = estimateSales(rankObj.rank, rankObj.displayGroup || rootCategory, marketplaceId);

            // If it's a sub-category rank, we apply a niche correction factor (0.5x)
            const adjustedSales = isRoot ? estimate.estimatedSales : Math.floor(estimate.estimatedSales * 0.5);

            if (adjustedSales > maxEstimate) {
                maxEstimate = adjustedSales;
                bestEstimate = {
                    estimatedSales: adjustedSales,
                    percentile: estimate.percentile,
                    categoryTotal: estimate.categoryTotal,
                    bestBsr: rankObj.rank
                };
            }
        }
    } else {
        bestEstimate.percentile = "NEW_RISING";
    }
    return bestEstimate;
}

export const handler: Handler = async (event: any) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: "",
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { access_token, asin, keywords, marketplaceId, region, pageToken, intent } = body;

        // Validation: Must have token AND (asin OR keywords OR asins)
        if (!access_token || (!asin && !keywords && !body.asins)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: access_token, and either asin, keywords or asins" }),
            };
        }

        // --- AUTH & CREDIT PRE-CHECK ---
        let userId: number | null = null;
        let userRole: string | null = null;

        if (intent !== 'get_offers' && intent !== 'get_batch_offers') {
            // 1. Try Authorization Header
            let token = event.headers.authorization?.replace('Bearer ', '');

            // 2. Fallback to Cookie
            if (!token) {
                const cookies = cookie.parse(event.headers.cookie || '');
                token = cookies.auth_token;
            }

            if (!token) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: "Unauthorized: Missing authentication token", code: 'AUTH_REQUIRED' }),
                };
            }

            try {
                const decoded: any = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId;
                userRole = decoded.role;
            } catch (e) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: "Unauthorized: Invalid or expired token", code: 'INVALID_TOKEN' }),
                };
            }
        }

        // --- PRE-PROCESSING: ASIN Detection ---
        let finalKeywords = keywords;
        let finalAsin = asin;

        if (!finalAsin && finalKeywords && /^(B\w{9}|\d{9}[0-9X])$/.test(finalKeywords)) {
            finalAsin = finalKeywords;
            finalKeywords = undefined;
        }

        const targetMarketplace = marketplaceId || "A1RKKUPIHCS9HS";

        // --- CREDIT CONSUMPTION ---
        if (intent !== 'get_offers' && intent !== 'get_batch_offers' && intent !== 'update_cache' && userId && userRole !== 'ADMIN') {
            try {
                const alreadyConsumed = await isAlreadyConsumed(userId, 'SEARCH_PRODUCT', finalAsin || finalKeywords);
                if (!alreadyConsumed) {
                    await consumeCredits(userId, 1, 'SEARCH_PRODUCT', { keywords: finalKeywords, asin: finalAsin });
                }
            } catch (e: any) {
                if (e.message === 'Insufficient credits') {
                    return { statusCode: 402, headers, body: JSON.stringify({ error: 'Insufficient credits', code: 'NO_CREDITS' }) };
                }
                throw e;
            }
        }

        // --- CACHE CHECK (GET ITEM) ---
        if (intent !== 'get_offers' && intent !== 'get_batch_offers' && finalAsin && !finalKeywords) {
            const cached = await getCachedProduct(finalAsin);
            if (cached) {
                console.log(`[Proxy] Cache hit for ASIN: ${finalAsin}`);

                let fba_fees = (cached.fba_fees || 0) * 100;
                let fba_breakdown = {
                    referral: (cached.referral_fee || 0) / 100,
                    fulfillment: (cached.fulfillment_fee || 0) / 100,
                    is_estimate: false
                };

                if (cached.raw_data && Object.keys(cached.raw_data).length > 0) {
                    const priceValue = (cached.price || 0) / 100;
                    const rawData = cached.raw_data as any;

                    // Re-calculate based on latest rankings and formula
                    const freshEstimate = getBestSalesEstimate(rawData, targetMarketplace);

                    const dimObj = rawData.attributes?.item_dimensions?.[0];
                    const weightObj = rawData.attributes?.item_weight?.[0];
                    const fbaResult = calculateFBAFees(
                        priceValue,
                        dimObj ? { height: dimObj.height?.value, width: dimObj.width?.value, length: dimObj.length?.value, unit: dimObj.height?.unit } : undefined,
                        weightObj ? { value: weightObj.value, unit: weightObj.unit } : undefined,
                        cached.category || undefined
                    );
                    fba_fees = fbaResult.totalFees;
                    fba_breakdown = {
                        referral: fbaResult.referralFee / 100,
                        fulfillment: fbaResult.fulfillmentFee / 100,
                        is_estimate: fbaResult.isEstimate
                    };

                    const monthlySls = freshEstimate.estimatedSales || 0;
                    const monthlyRev = Math.round(monthlySls * (priceValue - (fba_fees / 100)) * 100);

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            items: [{
                                asin: cached.asin,
                                summaries: [{
                                    itemName: cached.title,
                                    brandName: cached.brand,
                                    websiteDisplayGroupName: cached.category,
                                    price: cached.price ? { amount: cached.price / 100, currencyCode: cached.currency } : null
                                }],
                                images: cached.image ? [{ images: [{ variant: 'MAIN', link: cached.image }] }] : [],
                                attributes: { list_price: [{ value_with_tax: cached.price ? cached.price / 100 : 0, currency: cached.currency }] },
                                salesRanks: rawData.salesRanks,
                                estimated_sales: monthlySls,
                                sales_percentile: freshEstimate.percentile,
                                category_total: freshEstimate.categoryTotal,
                                estimated_revenue: monthlyRev / 100,
                                fba_fees: fba_fees / 100,
                                fba_breakdown: fba_breakdown,
                                active_sellers: (cached as any).active_sellers,
                                marketplace_id: cached.marketplace_id
                            }]
                        }),
                    };
                }
            }
        }

        // --- UPDATE CACHE INTENT ---
        if (intent === 'update_cache' && asin && body.price) {
            await cacheProduct({
                asin: asin,
                marketplace_id: targetMarketplace,
                title: body.title,
                image: body.image,
                category: body.category,
                brand: body.brand,
                price: body.price,
                currency: body.currency,
                bsr: body.bsr,
                estimated_sales: body.estimated_sales,
                estimated_revenue: body.estimated_revenue,
                estimated_monthly_profit: body.estimated_monthly_profit,
                fba_fees: body.fba_fees,
                referral_fee: body.referral_fee,
                fulfillment_fee: body.fulfillment_fee,
                net_profit: body.net_profit,
                sales_percentile: body.sales_percentile,
                is_list_price: body.is_list_price === undefined ? false : body.is_list_price,
                raw_data: body.raw_data
            });
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        // --- FETCH PROXY LOGIC ---
        const apiBaseUrl = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['EU'];
        let url = "";

        if (intent === 'get_batch_offers' && body.asins) {
            const fetchPromises = (body.asins as string[]).map(async (asin) => {
                const itemUrl = `${apiBaseUrl}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
                const itemRes = await fetch(itemUrl, { headers: { "x-amz-access-token": access_token } });
                return { status: { statusCode: itemRes.status }, body: await itemRes.json(), request: { uri: `/products/pricing/v0/items/${asin}/offers` } };
            });
            return { statusCode: 200, headers, body: JSON.stringify({ responses: await Promise.all(fetchPromises) }) };
        } else if (intent === 'get_offers' && finalAsin) {
            url = `${apiBaseUrl}/products/pricing/v0/items/${finalAsin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
        } else if (finalAsin) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${finalAsin}&identifiersType=ASIN&includedData=salesRanks,summaries,images,attributes`;
        } else if (finalKeywords) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(finalKeywords)}&includedData=salesRanks,summaries,images,attributes&pageSize=20`;
            if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        const amazonResponse = await fetch(url, { headers: { "x-amz-access-token": access_token, "Content-Type": "application/json" } });
        const catalogData = await amazonResponse.json();

        if (!amazonResponse.ok) {
            return { statusCode: amazonResponse.status, headers, body: JSON.stringify(catalogData) };
        }

        // Pricing Map Logic (REDUCED FOR BREVITY IN LOGS, but full implementation kept)
        let pricingMap: Record<string, { price: number, currency: string, offerCount: number }> = {};
        if (intent !== 'get_offers' && catalogData.items?.length > 0) {
            const uniqueAsins = Array.from(new Set(catalogData.items.map((i: any) => i.asin as string)));
            await Promise.all((uniqueAsins as string[]).map(async (asin: string) => {
                const pUrl = `${apiBaseUrl}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
                const pRes = await fetch(pUrl, { headers: { "x-amz-access-token": access_token } });
                if (pRes.ok) {
                    const pData = await pRes.json();
                    const payload = pData.payload;
                    if (payload) {
                        const buyBox = payload.Summary?.BuyBoxPrices?.find((bb: any) => bb.condition?.toLowerCase() === 'new');
                        const price = buyBox?.LandedPrice?.Amount || payload.Summary?.LowestPrices?.find((lp: any) => lp.condition?.toLowerCase() === 'new')?.LandedPrice?.Amount || 0;
                        const currency = buyBox?.LandedPrice?.CurrencyCode || payload.Summary?.LowestPrices?.[0]?.LandedPrice?.CurrencyCode || 'BRL';
                        let offerCount = 0;
                        payload.Summary.NumberOfOffers?.forEach((o: any) => { if (o.condition?.toLowerCase() === 'new') offerCount += (o.OfferCount || 0); });
                        pricingMap[asin] = { price, currency, offerCount };
                    }
                }
            }));
        }

        // Final Processing
        if (intent !== 'get_offers' && catalogData.items) {
            const processedItems = await Promise.all(catalogData.items.map(async (item: any) => {
                const salesEst = getBestSalesEstimate(item, targetMarketplace);
                const summary = item.summaries?.[0];
                const priceValue = pricingMap[item.asin]?.price || summary?.price?.amount || item.attributes?.list_price?.[0]?.value_with_tax || 0;
                const currencyCode = pricingMap[item.asin]?.currency || summary?.price?.currencyCode || 'BRL';

                const fbaRes = calculateFBAFees(priceValue, item.attributes?.item_dimensions?.[0], item.attributes?.item_weight?.[0], summary?.websiteDisplayGroupName || '');
                const netProfitCents = Math.round((priceValue - (fbaRes.totalFees / 100)) * 100);
                const estimated_revenue_cents = Math.round((salesEst.estimatedSales || 0) * (priceValue - (fbaRes.totalFees / 100)) * 100);

                const mainImage = item.images?.[0]?.images?.find((img: any) => img.variant === 'MAIN')?.link;
                const active_sellers = pricingMap[item.asin]?.offerCount || summary?.offerCount || 1;

                cacheProduct({
                    asin: item.asin,
                    marketplace_id: targetMarketplace,
                    title: summary?.itemName,
                    image: mainImage,
                    category: summary?.websiteDisplayGroupName,
                    brand: summary?.brandName || summary?.brand,
                    price: Math.round(priceValue * 100),
                    currency: currencyCode,
                    bsr: salesEst.bestBsr,
                    estimated_sales: salesEst.estimatedSales || undefined,
                    estimated_revenue: estimated_revenue_cents,
                    fba_fees: fbaRes.totalFees,
                    net_profit: netProfitCents,
                    sales_percentile: salesEst.percentile,
                    active_sellers,
                    raw_data: item
                } as any).catch(e => console.error(e));

                return {
                    ...item,
                    active_sellers,
                    estimated_sales: salesEst.estimatedSales,
                    estimated_revenue: estimated_revenue_cents / 100,
                    fba_fees: fbaRes.totalFees / 100,
                    fba_breakdown: { referral: fbaRes.referralFee / 100, fulfillment: fbaRes.fulfillmentFee / 100, is_estimate: fbaRes.isEstimate },
                    net_profit: netProfitCents / 100,
                    sales_percentile: salesEst.percentile,
                    category_total: salesEst.categoryTotal,
                    price: priceValue,
                    currency: currencyCode
                };
            }));
            return { statusCode: 200, headers, body: JSON.stringify({ ...catalogData, items: processedItems }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify(catalogData) };

    } catch (error: any) {
        console.error(error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
