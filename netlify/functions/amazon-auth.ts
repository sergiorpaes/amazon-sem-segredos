import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
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
        const { grant_type, refresh_token, client_id, client_secret, region } = body;

        // Determine Region suffix (Default to EU if not provided, though typically passed)
        const regionSuffix = region ? region.toUpperCase() : 'EU';

        // Resolve Credentials: Use provided body values OR fallback to Environment Variables
        const final_client_id = client_id || process.env[`AMAZON_${regionSuffix}_CLIENT_ID`];
        const final_client_secret = client_secret || process.env[`AMAZON_${regionSuffix}_CLIENT_SECRET`];
        const final_refresh_token = refresh_token || process.env[`AMAZON_${regionSuffix}_REFRESH_TOKEN`];

        if (!final_refresh_token || !final_client_id || !final_client_secret) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing required fields",
                    details: "Please provide client_id, client_secret, and refresh_token in the body, OR configure them as server environment variables (e.g. AMAZON_NA_CLIENT_ID)."
                }),
            };
        }

        console.log(`Requesting Amazon Token for region: ${regionSuffix} using ${client_id ? 'Local' : 'Server'} Credentials...`);

        const params = new URLSearchParams();
        params.append("grant_type", grant_type || "refresh_token");
        params.append("refresh_token", final_refresh_token);
        params.append("client_id", final_client_id);
        params.append("client_secret", final_client_secret);

        const amazonResponse = await fetch("https://api.amazon.com/auth/o2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });

        const data = await amazonResponse.json();

        if (!amazonResponse.ok) {
            console.error("Amazon API Error:", data);
            return {
                statusCode: amazonResponse.status,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
