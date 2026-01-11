import { Handler } from "@netlify/functions";

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
        const { access_token, asin, keywords, marketplaceId, region } = body;

        // Validation: Must have token AND (asin OR keywords)
        if (!access_token || (!asin && !keywords)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: access_token, and either asin or keywords" }),
            };
        }

        // Determine API Endpoint based on Region (Default to EU if missing)
        const apiBaseUrl = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['EU'];

        // Default to Spain if not provided
        const targetMarketplace = marketplaceId || "A1RKKUPIHCS9HS";

        // Construct the SP-API URL
        let url = "";
        if (asin) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&identifiers=${asin}&identifiersType=ASIN&includedData=salesRanks,summaries`;
        } else if (keywords) {
            url = `${apiBaseUrl}/catalog/2022-04-01/items?marketplaceIds=${targetMarketplace}&keywords=${encodeURIComponent(keywords)}&includedData=salesRanks,summaries&pageSize=10`;
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
