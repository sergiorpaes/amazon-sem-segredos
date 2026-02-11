import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits } from '../../src/lib/credits';
import { getCachedProduct, cacheProduct } from './utils/product-cache';
import { estimateSales } from './utils/sales-estimation';

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

        // Validation: Must have token AND (asin OR keywords)
        if (!access_token || (!asin && !keywords)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: access_token, and either asin or keywords" }),
            };
        }

        // --- AUTH & CREDIT PRE-CHECK ---
        let userId: number | null = null;
        let userRole: string | null = null;

        if (intent !== 'get_offers') {
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
        if (intent !== 'get_offers' && asin && !keywords) {
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
        if (intent !== 'get_offers' && userId && userRole !== 'ADMIN') {
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
        if (intent === 'get_offers' && asin) {
            url = `${apiBaseUrl}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
        } else if (asin) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${asin}&identifiersType=ASIN&includedData=salesRanks,summaries,images,attributes`;
        } else if (keywords) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(keywords)}&includedData=salesRanks,summaries,images,attributes&pageSize=20`;
            if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        console.log(`Proxying request: ${url}`);

        const amazonResponse = await fetch(url, {
            method: "GET",
            headers: {
                "x-amz-access-token": access_token,
                "Content-Type": "application/json",
            },
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

                if (mainRank) {
                    const estimate = estimateSales(mainRank.rank, mainRank.displayGroup || item.summaries?.[0]?.websiteDisplayGroupName || '');
                    estimated_sales = estimate.estimatedSales;
                    sales_percentile = estimate.percentile;
                }

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
                    price: summary?.price?.amount ? Math.round(summary.price.amount * 100) :
                        (item.attributes?.list_price?.[0]?.value_with_tax ? Math.round(item.attributes.list_price[0].value_with_tax * 100) : undefined),
                    currency: summary?.price?.currencyCode || item.attributes?.list_price?.[0]?.currency,
                    bsr: mainRank?.rank,
                    estimated_sales: estimated_sales || undefined,
                    sales_percentile: sales_percentile as string | undefined, // Type cast for compatibility
                    raw_data: item
                }).catch(err => console.error("[Cache] Save error:", err));

                return {
                    ...item,
                    estimated_sales,
                    sales_percentile
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
