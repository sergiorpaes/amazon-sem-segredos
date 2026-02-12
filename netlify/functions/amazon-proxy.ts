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

                // Re-calculate FBA fees to ensure they follow the latest logic
                let fba_fees = (cached.fba_fees || 0) * 100; // stored in cents logic for re-calc
                let fba_breakdown = {
                    referral: (cached.referral_fee || 0) / 100,
                    fulfillment: (cached.fulfillment_fee || 0) / 100,
                    is_estimate: false
                };

                if (cached.raw_data && Object.keys(cached.raw_data).length > 0) {
                    const priceValue = (cached.price || 0) / 100;
                    const rawData = cached.raw_data as any;
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
                }

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
                            sales_percentile: cached.sales_percentile,
                            fba_fees: fba_fees / 100,
                            fba_breakdown: fba_breakdown,
                            net_profit: ((cached.price || 0) - (fba_fees || 0)) / 100
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

        // Auto-detect ASIN in keywords (e.g., B01I3A16DI or 123456789X)
        let finalKeywords = keywords;
        let finalAsin = asin;

        if (!finalAsin && finalKeywords && /^(B\w{9}|\d{9}[0-9X])$/.test(finalKeywords)) {
            console.log(`[Proxy] Detected ASIN in keywords: ${finalKeywords}. Switching to identifiers search.`);
            finalAsin = finalKeywords;
            finalKeywords = undefined;
        }

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
                is_list_price: body.is_list_price === undefined ? false : body.is_list_price,
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
        } else if (intent === 'get_offers' && finalAsin) {
            url = `${apiBaseUrl}/products/pricing/v0/items/${finalAsin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;
        } else if (finalAsin) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${finalAsin}&identifiersType=ASIN&includedData=salesRanks,summaries,images,attributes`;
        } else if (finalKeywords) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(finalKeywords)}&includedData=salesRanks,summaries,images,attributes&pageSize=20`;
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

        const catalogData = await amazonResponse.json();

        if (!amazonResponse.ok) {
            return {
                statusCode: amazonResponse.status,
                headers,
                body: JSON.stringify(catalogData),
            };
        }

        console.log(`[Proxy] Catalog Search Status: ${amazonResponse.status}`);
        if (catalogData.items) {
            console.log(`[Proxy] Catalog Search Items Found: ${catalogData.items.length}`);
            if (catalogData.items.length === 0) {
                console.log(`[Proxy] WARNING: 0 items found for keywords: ${keywords}`);
            }
        } else {
            console.log(`[Proxy] Catalog Search Response (No Items):`, JSON.stringify(catalogData));
        }

        // --- BATCH PRICING CALL (NEW) ---
        // If we have items, fetch their prices specifically
        let pricingMap: Record<string, any> = {};

        if (intent !== 'get_offers' && catalogData.items && Array.isArray(catalogData.items) && catalogData.items.length > 0) {
            try {
                const uniqueAsins = [...new Set(catalogData.items.map((i: any) => i.asin))].slice(0, 20); // Unique & Max 20

                const priceUrl = `${apiBaseUrl}/batches/products/pricing/v0/itemOffers`;
                const priceBody = JSON.stringify({
                    requests: uniqueAsins.map((asin: unknown) => ({
                        uri: `/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`,
                        method: 'GET'
                    }))
                });

                console.log(`[Proxy] Fetching Batch Prices for ${uniqueAsins.length} items`);
                // console.log(`[Proxy] Batch Request Body: ${priceBody}`); // DEBUG

                const priceResponse = await fetch(priceUrl, {
                    method: 'POST',
                    headers: {
                        "x-amz-access-token": access_token,
                        "Content-Type": "application/json",
                    },
                    body: priceBody
                });

                console.log(`[Proxy] Batch Price Status: ${priceResponse.status} ${priceResponse.statusText}`);

                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    // console.log(`[Proxy] Batch Price Response (Slice):`, JSON.stringify(priceData).substring(0, 500)); // DEBUG

                    // Process responses
                    priceData.responses?.forEach((res: any) => {
                        // Parse success response
                        if (res.status?.statusCode === 200 && res.body?.payload) {
                            const payload = res.body.payload;
                            const asin = payload.ASIN;

                            // DEBUG: Specific ASIN check
                            if (asin === 'B084S6BCJN') {
                                console.log(`[Proxy] DEBUG B084S6BCJN Payload:`, JSON.stringify(payload));
                            }

                            // 1. Get Buy Box Price
                            // Priority: BuyBox ListingPrice > BuyBox LandedPrice > LowestPrice LandedPrice
                            const buyBox = payload.Summary?.BuyBoxPrices?.find((bb: any) => bb.condition?.toLowerCase() === 'new');

                            let price = 0;
                            let currency = 'BRL';

                            if (buyBox) {
                                price = buyBox.ListingPrice?.Amount || buyBox.LandedPrice?.Amount || 0;
                                currency = buyBox.ListingPrice?.CurrencyCode || buyBox.LandedPrice?.CurrencyCode || 'BRL';
                            } else {
                                // Fallback to Lowest Prices if no Buy Box
                                price = payload.Summary?.LowestPrices?.[0]?.LandedPrice?.Amount || 0;
                                currency = payload.Summary?.LowestPrices?.[0]?.LandedPrice?.CurrencyCode || 'BRL';
                            }

                            // 2. Get Active Sellers (Sum of OfferCounts)
                            let offerCount = 0;
                            if (payload.Summary?.NumberOfOffers) {
                                payload.Summary.NumberOfOffers.forEach((o: any) => {
                                    const cond = o.condition?.toLowerCase();
                                    if (cond === 'new') {
                                        offerCount += (o.OfferCount || 0);
                                    }
                                });
                            }

                            pricingMap[asin] = {
                                price: price,
                                currency: currency,
                                offerCount: offerCount
                            };

                            if (asin === 'B084S6BCJN') {
                                console.log(`[Proxy] DEBUG B084S6BCJN Mapped:`, pricingMap[asin]);
                            }
                        } else {
                            console.warn(`[Proxy] Batch Item Failed for an ASIN:`, res.status);
                        }
                    });
                } else {
                    const errText = await priceResponse.text();
                    console.warn(`[Proxy] Batch Price Failed: ${priceResponse.status}`, errText);
                }

            } catch (err) {
                console.error("[Proxy] Batch Price Error:", err);
            }
        }

        // --- PROCESS & INJECT SALES DATA ---
        if (intent !== 'get_offers' && catalogData.items && Array.isArray(catalogData.items)) {
            const processedItems = await Promise.all(catalogData.items.map(async (item: any) => {
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
                // In Brazil, 'price' in summaries often reflects the actual selling price
                const summary = item.summaries?.[0];
                const sellingPrice = summary?.price?.amount;
                const buyBoxPrice = summary?.buyBoxPrice?.amount; // Some API versions include this

                // Fallbacks from Catalog Attributes (Exhaustive search for Brazil)
                const attrListPrice = item.attributes?.list_price?.[0]?.value_with_tax || item.attributes?.list_price?.[0]?.amount;
                const attrStandardPrice = item.attributes?.standard_price?.[0]?.value_with_tax || item.attributes?.standard_price?.[0]?.amount;
                const attrPurchasablePrice = item.attributes?.purchasable_offer?.[0]?.our_price?.[0]?.value_with_tax || item.attributes?.purchasable_offer?.[0]?.our_price?.[0]?.amount;
                const attrMapPrice = item.attributes?.map_price?.[0]?.value_with_tax || item.attributes?.map_price?.[0]?.amount;

                // --- PRICE PRIORITY ---
                // 1. Batch API BuyBox/Lowest (Best)
                // 2. Summaries BuyBox (Good)
                // 3. Summaries Selling Price (Okay)
                // 4. Attribute List Price (Fallback)

                const batchPrice = pricingMap[item.asin]?.price;
                const batchCurrency = pricingMap[item.asin]?.currency;

                let priceValue = batchPrice || buyBoxPrice || sellingPrice || attrStandardPrice || attrPurchasablePrice || attrMapPrice || attrListPrice || 0;
                let currencyCode = batchCurrency || summary?.price?.currencyCode || item.attributes?.list_price?.[0]?.currency || 'BRL';

                // Get Active Sellers Count (Priority: Batch > Summaries > Default 1)
                const active_sellers = pricingMap[item.asin]?.offerCount || item.summaries?.[0]?.offerCount || 1;

                // It's a "List Price" fallback only if we didn't find ANY sellable price and had to use attrListPrice
                const isListPrice = !batchPrice && !buyBoxPrice && !sellingPrice && !attrStandardPrice && !attrPurchasablePrice && !attrMapPrice && !!attrListPrice;

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
                const mainImage = item.images?.[0]?.images?.find((img: any) => img.variant === 'MAIN')?.link;

                cacheProduct({
                    asin: item.asin,
                    marketplace_id: targetMarketplace,
                    title: summary?.itemName,
                    image: mainImage,
                    category: summary?.websiteDisplayGroupName,
                    brand: summary?.brandName || summary?.brand,
                    price: Math.round(priceValue * 100),
                    currency: currencyCode,
                    bsr: mainRank?.rank,
                    estimated_sales: estimated_sales || undefined,
                    estimated_revenue: estimated_revenue || undefined,
                    fba_fees: fbaResult.totalFees,
                    referral_fee: fbaResult.referralFee,
                    fulfillment_fee: fbaResult.fulfillmentFee,
                    net_profit: net_profit,
                    sales_percentile: sales_percentile as string | undefined, // Type cast for compatibility
                    is_list_price: isListPrice,
                    active_sellers: active_sellers,
                    raw_data: item
                } as any).catch(err => console.error("[Cache] Save error:", err));

                return {
                    ...item,
                    active_sellers,
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
                    category_total,
                    is_list_price: isListPrice
                };
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ...catalogData, items: processedItems }),
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(catalogData),
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
