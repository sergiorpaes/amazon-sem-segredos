import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits } from '../../src/lib/credits';
import { getCachedProduct, cacheProduct } from './utils/product-cache';
import { estimateSales } from './utils/sales-estimation';
import { calculateFBAFees } from './utils/fba-calculator';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

const REGION_ENDPOINTS: Record<string, string> = {
    'NA': 'https://sellingpartnerapi-na.amazon.com',
    'EU': 'https://sellingpartnerapi-eu.amazon.com',
    'FE': 'https://sellingpartnerapi-fe.amazon.com'
};

export const handler: Handler = async (event, context) => {
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

        // --- CACHE CHECK (Only for Search/GetItem, not Pricing) ---
        if (intent !== 'get_offers' && intent !== 'get_batch_offers' && asin && !keywords) {
            const cached = await getCachedProduct(asin);
            if (cached) {
                console.log(`[Proxy] Cache hit for ASIN: ${asin}`);
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
                            estimated_sales: cached.estimated_sales,
                            sales_percentile: cached.sales_percentile
                        }]
                    }),
                };
            }
        }

        // --- CREDIT CONSUMPTION (Only if not cached and not Pricing) ---
        if (intent !== 'get_offers' && intent !== 'get_batch_offers' && userId && userRole !== 'ADMIN') {
            try {
                await consumeCredits(userId, 1, 'SEARCH_PRODUCT', { keywords, asin });
                console.log(`[Proxy] Credit consumed for UserID: ${userId}`);
            } catch (e: any) {
                if (e.message === 'Insufficient credits') {
                    return {
                        statusCode: 402,
                        headers,
                        body: JSON.stringify({ error: 'Insufficient credits', code: 'NO_CREDITS' })
                    };
                }
                throw e;
            }
        }

        // --- AMAZON SP-API CALL ---
        const apiBaseUrl = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['EU'];
        const targetMarketplace = marketplaceId || "A1RKKUPIHCS9HS";

        let url = "";
        let method = "GET";
        let requestBody = null;

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
                fba_fees: body.fba_fees,
                referral_fee: body.referral_fee,
                fulfillment_fee: body.fulfillment_fee,
                net_profit: body.net_profit,
                sales_percentile: body.sales_percentile,
                raw_data: body.raw_data
            });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: "Cache updated" }),
            };
        }

        if (intent === 'get_batch_offers' && body.asins) {
            url = `${apiBaseUrl}/batches/products/pricing/v0/itemOffers`;
            method = "POST";
            requestBody = JSON.stringify({
                requests: body.asins.map((asin: string) => ({
                    uri: `/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`,
                    method: 'GET'
                }))
            });
        } else if (intent === 'get_offers' && asin) {
            url = `${apiBaseUrl}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
        } else if (asin) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${asin}&identifiersType=ASIN&includedData=salesRanks,summaries,images,attributes`;
        } else if (keywords) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(keywords)}&includedData=salesRanks,summaries,images,attributes&pageSize=20`;
            if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        console.log(`Proxying request: ${url} (Method: ${method})`);

        const amazonResponse = await fetch(url, {
            method: method,
            headers: {
                "x-amz-access-token": access_token,
                "Content-Type": "application/json",
            },
            body: requestBody
        });

        const data = await amazonResponse.json();

        if (!amazonResponse.ok) {
            return {
                statusCode: amazonResponse.status,
                headers,
                body: JSON.stringify(data),
            };
        }

        // --- PROCESS & INJECT SALES DATA ---
        if (intent !== 'get_offers' && data.items && Array.isArray(data.items)) {
            const processedItems = await Promise.all(data.items.map(async (item: any) => {
                // Get BSR
                const salesRanks = item.salesRanks?.[0]?.displayGroupRanks || [];
                const mainRank = salesRanks[0]; // Primary BSR

                let estimated_sales = null;
                let sales_percentile = undefined;
                let category_total = 0;

                if (mainRank) {
                    const estimate = estimateSales(mainRank.rank, mainRank.displayGroup || item.summaries?.[0]?.websiteDisplayGroupName || '');
                    estimated_sales = estimate.estimatedSales;
                    sales_percentile = estimate.percentile;
                    category_total = estimate.categoryTotal;
                } else {
                    // BSR Fallback: Marker for Frontend to use Search Volume logic
                    sales_percentile = "NEW_RISING";
                }

                // Calculate Revenue
                // --- Buy Box Price Supremacy ---
                // Force Current Offer Price (summaries) as primary, ignore MSRP (list_price)
                const priceValue = item.summaries?.[0]?.price?.amount || item.attributes?.list_price?.[0]?.value_with_tax || 0;
                const estimated_revenue = estimated_sales ? Math.round(priceValue * estimated_sales * 100) : 0;

                // Calculate FBA Fees (Pass category for dynamic referral fees)
                const dimObj = item.attributes?.item_dimensions?.[0];
                const weightObj = item.attributes?.item_weight?.[0];

                const fbaResult = calculateFBAFees(
                    priceValue,
                    dimObj ? { height: dimObj.height?.value, width: dimObj.width?.value, length: dimObj.length?.value, unit: dimObj.height?.unit } : undefined,
                    weightObj ? { value: weightObj.value, unit: weightObj.unit } : undefined,
                    item.summaries?.[0]?.websiteDisplayGroupName || ''
                );

                const net_profit = Math.round((priceValue - (fbaResult.totalFees / 100)) * 100);

                // Async Cache Save (Don't await to keep response fast)
                const summary = item.summaries?.[0];
                const mainImage = item.images?.[0]?.images?.find((img: any) => img.variant === 'MAIN')?.link;

                cacheProduct({
                    asin: item.asin,
                    marketplace_id: targetMarketplace,
                    title: summary?.itemName,
                    image: mainImage,
                    category: summary?.websiteDisplayGroupName,
                    brand: summary?.brandName || summary?.brand,
                    price: Math.round(priceValue * 100),
                    currency: summary?.price?.currencyCode || item.attributes?.list_price?.[0]?.currency,
                    bsr: mainRank?.rank,
                    estimated_sales: estimated_sales || undefined,
                    estimated_revenue: estimated_revenue || undefined,
                    fba_fees: fbaResult.totalFees,
                    referral_fee: fbaResult.referralFee,
                    fulfillment_fee: fbaResult.fulfillmentFee,
                    net_profit: net_profit,
                    sales_percentile: sales_percentile as string | undefined, // Type cast for compatibility
                    raw_data: item
                }).catch(err => console.error("[Cache] Save error:", err));

                return {
                    ...item,
                    estimated_sales,
                    estimated_revenue: estimated_revenue / 100, // Return as float
                    fba_fees: fbaResult.totalFees / 100,
                    fba_breakdown: {
                        referral: fbaResult.referralFee / 100,
                        fulfillment: fbaResult.fulfillmentFee / 100,
                        is_estimate: fbaResult.isEstimate
                    },
                    net_profit: net_profit / 100,
                    sales_percentile,
                    category_total
                };
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ...data, items: processedItems }),
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
        };

    } catch (error: any) {
        console.error("Internal Proxy Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
