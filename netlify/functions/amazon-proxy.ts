import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits } from '../../src/lib/credits';

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

        // --- CREDIT CONSUMPTION LOGIC ---
        // Only consume credit for "Search" (which is the main expensive/valuable action).
        // If intent is 'get_offers', we skip consumption to avoid draining credits on detail views.
        if (intent !== 'get_offers') {
            console.log(`[Proxy] Consuming credits for intent: ${intent || 'search'}`);
            const cookies = cookie.parse(event.headers.cookie || '');
            const token = cookies.auth_token;

            if (!token) {
                console.error("[Proxy] No auth_token cookie provided. Blocking request.");
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: "Unauthorized: Missing authentication token", code: 'AUTH_REQUIRED' }),
                };
            }

            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
                const userId = decoded.userId;
                console.log(`[Proxy] Consuming 1 credit for UserID: ${userId}`);
                // Consume 1 credit for SEARCH_PRODUCT
                await consumeCredits(userId, 1, 'SEARCH_PRODUCT', {
                    keywords,
                    asin
                });
                console.log(`[Proxy] Credit consumed successfully for UserID: ${userId}`);
            } catch (e: any) {
                console.error("[Proxy] Credit Consumption Error:", e);
                if (e.message === 'Insufficient credits') {
                    return {
                        statusCode: 402,
                        headers,
                        body: JSON.stringify({ error: 'Insufficient credits', code: 'NO_CREDITS' })
                    };
                }
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: "Unauthorized: Invalid or expired token", code: 'INVALID_TOKEN' }),
                };
            }
        }
        // --------------------------------

        // Determine API Endpoint based on Region (Default to EU if missing)
        const apiBaseUrl = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['EU'];

        // Default to Spain if not provided
        const targetMarketplace = marketplaceId || "A1RKKUPIHCS9HS";

        // Construct the SP-API URL
        let url = "";
        if (intent === 'get_offers' && asin) {
            // Pricing API: Get Offers
            url = `${apiBaseUrl}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${targetMarketplace}&ItemCondition=New`;

        } else if (asin) {
            // Catalog API: Get Item
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${asin}&identifiersType=ASIN&includedData=salesRanks,summaries,images,attributes`;
        } else if (keywords) {
            // Catalog API: Search
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(keywords)}&includedData=salesRanks,summaries,images,attributes&pageSize=20`;
            if (pageToken) {
                url += `&pageToken=${encodeURIComponent(pageToken)}`;
            }
        }

        console.log(`Proxying request to Amazon SP-API (${region || 'Default'}): ${url}`);

        const amazonResponse = await fetch(url, {
            method: "GET",
            headers: {
                "x-amz-access-token": access_token,
                "Content-Type": "application/json",
            },
        });

        const data = await amazonResponse.json();

        if (!amazonResponse.ok) {
            console.error("Amazon SP-API Error:", data);
            return {
                statusCode: amazonResponse.status,
                headers,
                body: JSON.stringify(data),
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
