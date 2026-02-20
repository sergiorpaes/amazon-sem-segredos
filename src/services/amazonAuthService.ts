import { useState } from 'react';

export type Region = 'NA' | 'EU' | 'FE'; // North America, Europe, Far East

export interface AmazonCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    grantType?: string;
    apiUrl?: string;
    region?: Region; // Added region tag
}

// Mapping of Marketplace IDs to Regions
const MARKETPLACE_REGION_MAP: Record<string, Region> = {
    // North America (NA)
    'A2EUQ1WTGCTBG2': 'NA', // Canada
    'ATVPDKIKX0DER': 'NA', // US
    'A1AM78C64UM0Y8': 'NA', // Mexico
    'A2Q3Y263D00KWC': 'NA', // Brazil

    // Europe (EU)
    'A28R8C7NBKEWEA': 'EU', // Ireland
    'A1RKKUPIHCS9HS': 'EU', // Spain
    'A1F83G8C2ARO7P': 'EU', // UK
    'A13V1IB3VIYZZH': 'EU', // France
    'AMEN7PMS3EDWL': 'EU',  // Belgium
    'A1805IZSGTT6HS': 'EU', // Netherlands
    'A1PA6795UKMFR9': 'EU', // Germany
    'APJ6JRA9NG5V4': 'EU',  // Italy
    'A2NODRKZP88ZB9': 'EU', // Sweden
    'AE08WJ6YKNBMC': 'EU',  // South Africa
    'A1C3SOZRARQ6R3': 'EU', // Poland
    'ARBP9OOSHTCHU': 'EU',  // Egypt
    'A33AVAJ2PDY3EV': 'EU', // Turkey
    'A17E79C6D8DWNP': 'EU', // Saudi Arabia
    'A2VIGQ35RCS4UG': 'EU', // UAE
    'A21TJRUUN4KGV': 'EU',  // India (Often grouped with EU in some contexts or standalone, mapping to EU for now per user grouping "Europe for other countries")

    // Far East (FE)
    'A19VAU5U5O7RUS': 'FE', // Singapore
    'A39IBJ37TRP1C6': 'FE', // Australia
    'A1VC38T7YXB528': 'FE', // Japan
};

export const SUPPORTED_MARKETPLACES = [
    // North America
    { name: 'United States', id: 'ATVPDKIKX0DER', code: 'US', flag: '🇺🇸', region: 'NA' as Region },
    { name: 'Canada', id: 'A2EUQ1WTGCTBG2', code: 'CA', flag: '🇨🇦', region: 'NA' as Region },
    { name: 'Mexico', id: 'A1AM78C64UM0Y8', code: 'MX', flag: '🇲🇽', region: 'NA' as Region },
    { name: 'Brazil', id: 'A2Q3Y263D00KWC', code: 'BR', flag: '🇧🇷', region: 'NA' as Region },
    // Europe
    { name: 'Spain', id: 'A1RKKUPIHCS9HS', code: 'ES', flag: '🇪🇸', region: 'EU' as Region },
    { name: 'United Kingdom', id: 'A1F83G8C2ARO7P', code: 'UK', flag: '🇬🇧', region: 'EU' as Region },
    { name: 'Germany', id: 'A1PA6795UKMFR9', code: 'DE', flag: '🇩🇪', region: 'EU' as Region },
    { name: 'France', id: 'A13V1IB3VIYZZH', code: 'FR', flag: '🇫🇷', region: 'EU' as Region },
    { name: 'Italy', id: 'APJ6JRA9NG5V4', code: 'IT', flag: '🇮🇹', region: 'EU' as Region },
    { name: 'Netherlands', id: 'A1805IZSGTT6HS', code: 'NL', flag: '🇳🇱', region: 'EU' as Region },
    { name: 'Sweden', id: 'A2NODRKZP88ZB9', code: 'SE', flag: '🇸🇪', region: 'EU' as Region },
    { name: 'Poland', id: 'A1C3SOZRARQ6R3', code: 'PL', flag: '🇵🇱', region: 'EU' as Region },
    { name: 'Turkey', id: 'A33AVAJ2PDY3EV', code: 'TR', flag: '🇹🇷', region: 'EU' as Region },
    // Middle East
    { name: 'UAE', id: 'A2VIGQ35RCS4UG', code: 'AE', flag: '🇦🇪', region: 'EU' as Region },
    { name: 'Saudi Arabia', id: 'A17E79C6D8DWNP', code: 'SA', flag: '🇸🇦', region: 'EU' as Region },
    // Asia Pacific
    { name: 'India', id: 'A21TJRUUN4KGV', code: 'IN', flag: '🇮🇳', region: 'EU' as Region }, // Using EU as per map
    { name: 'Japan', id: 'A1VC38T7YXB528', code: 'JP', flag: '🇯🇵', region: 'FE' as Region },
    { name: 'Australia', id: 'A39IBJ37TRP1C6', code: 'AU', flag: '🇦🇺', region: 'FE' as Region },
    { name: 'Singapore', id: 'A19VAU5U5O7RUS', code: 'SG', flag: '🇸🇬', region: 'FE' as Region },
];

const getRegionFromMarketplaceId = (marketplaceId: string): Region => {
    return MARKETPLACE_REGION_MAP[marketplaceId] || 'EU'; // Default to EU if unknown
};

export const connectToAmazon = async (credentials: AmazonCredentials) => {
    try {
        const response = await fetch('/.netlify/functions/amazon-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: credentials.grantType || 'refresh_token',
                refresh_token: credentials.refreshToken,
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                api_url: credentials.apiUrl,
                region: credentials.region // Pass region to allow env var lookup
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.error || 'Failed to connect to Amazon');
        }

        // Store token in session storage for the Product Finder to use (Region specific)
        if (data.access_token && credentials.region) {
            sessionStorage.setItem(`amazon_access_token_${credentials.region}`, data.access_token);
            // Calculate expiration (subtract 60s for safety buffer)
            const expiresAt = new Date().getTime() + ((data.expires_in - 60) * 1000);
            sessionStorage.setItem(`amazon_token_expires_at_${credentials.region}`, expiresAt.toString());
        }

        return data;
    } catch (error) {
        console.error("Amazon Auth Error:", error);
        throw error;
    }
};

// Updated Storage Keys to support Regions
export const saveCredentials = (credentials: AmazonCredentials, region: Region) => {
    // Add region property before saving
    const credsToSave = { ...credentials, region };
    localStorage.setItem(`amazon_creds_${region}`, JSON.stringify(credsToSave));
};

export const loadCredentials = (region: Region): AmazonCredentials | null => {
    const data = localStorage.getItem(`amazon_creds_${region}`);
    return data ? JSON.parse(data) : null;
};

export const getValidAccessToken = async (region: Region): Promise<string | null> => {
    // 1. Check existing session token for Region
    const token = sessionStorage.getItem(`amazon_access_token_${region}`);
    const expiresAt = sessionStorage.getItem(`amazon_token_expires_at_${region}`);

    if (token && expiresAt) {
        if (new Date().getTime() < parseInt(expiresAt)) {
            return token; // Token is still valid
        }
    }

    // 2. Token expired or missing, try to auto-refresh
    // Attempt to load local credentials, OR create a fallback object to try server-side auth
    const creds = loadCredentials(region) || {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        region: region
    };

    try {
        console.log(`Refreshing Amazon Token for region ${region}...`);
        const result = await connectToAmazon({ ...creds, region }); // Ensure region is set
        return result.access_token;
    } catch (e) {
        console.error(`Failed to auto-refresh token for ${region}:`, e);
        return null;
    }
};

export interface AmazonProductResult {
    numberOfResults?: number;
    items?: Array<{
        asin: string;
        images?: Array<{
            marketplaceId: string;
            images: Array<{
                variant: string;
                link: string;
                height: number;
                width: number;
            }>;
        }>;
        summaries?: Array<{
            itemName?: string;
            brandName?: string;
            brand?: string; // Added based on user feedback
            manufacturer?: string;
            websiteDisplayGroupName?: string;
            price?: {
                amount: number;
                currencyCode: string;
            };
        }>;
        attributes?: any; // Added to capture full attributes payload including price
    }>;
    pagination?: {
        nextToken?: string;
        previousToken?: string;
    };
}

// Helper to check if string looks like an ASIN (10 chars, alphanumeric)
const isLikelyAsin = (text: string) => /^[A-Z0-9]{10}$/.test(text.toUpperCase());

export const searchProducts = async (query: string, marketplaceId?: string, pageToken?: string): Promise<AmazonProductResult | null> => {
    const targetMarketplace = marketplaceId || 'A1RKKUPIHCS9HS'; // Default ES
    const region = getRegionFromMarketplaceId(targetMarketplace);

    console.log(`Searching in Marketplace: ${targetMarketplace} -> Region: ${region}`);

    const token = await getValidAccessToken(region);

    if (!token) {
        const regionNames = { 'NA': 'América do Norte', 'EU': 'Europa', 'FE': 'Extremo Oriente/Outros' };
        throw new Error(`⚠️ Configuração para ${regionNames[region]} não encontrada ou inválida. Por favor, acesse a aba 'Configurações', selecione '${regionNames[region]}' e insira suas credenciais.`);
    }

    const payload: any = {
        access_token: token,
        marketplaceId: targetMarketplace,
        region: region, // Pass detected region to proxy
        pageToken: pageToken // Pass pagination token if exists
    };

    // Smart detection: ASIN or Keyword?
    if (isLikelyAsin(query)) {
        console.log(`Detectado ASIN: ${query}`);
        payload.asin = query;
    } else {
        console.log(`Detectada Palavra-chave: ${query}`);
        payload.keywords = query;
    }

    const response = await fetch('/.netlify/functions/amazon-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        // Amazon SP-API often returns an array of errors
        let errorMsg = data.error || data.message || "Erro ao buscar produto na Amazon.";
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            errorMsg = `Amazon SP-API Error (${response.status}): ${data.errors[0].code} - ${data.errors[0].message}`;
        }
        throw new Error(errorMsg);
    }

    return data;
};

export const getBatchOffers = async (asins: string[], marketplaceId?: string): Promise<Record<string, { price: number, activeSellers: number, currency: string, fallbackUsed?: boolean } | null>> => {
    const targetMarketplace = marketplaceId || 'A1RKKUPIHCS9HS'; // Default ES
    const region = getRegionFromMarketplaceId(targetMarketplace);
    const token = await getValidAccessToken(region);

    if (!token || !asins.length) return {};

    const payload = {
        access_token: token,
        marketplaceId: targetMarketplace,
        region: region,
        asins: asins,
        intent: 'get_batch_offers'
    };

    try {
        const response = await fetch('/.netlify/functions/amazon-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error(`Error fetching batch offers:`, data);
            return {};
        }

        const results: Record<string, { price: number, activeSellers: number, currency: string, fallbackUsed?: boolean } | null> = {};

        if (data.responses && Array.isArray(data.responses)) {
            data.responses.forEach((resp: any) => {
                // Robust sub-response body parsing
                let body = resp.body;
                if (typeof body === 'string') {
                    try { body = JSON.parse(body); } catch (e) { console.error("Failed to parse sub-response body", e); }
                }

                const asinMatch = resp.request?.uri?.match(/\/items\/([A-Z0-9]{10})/i);
                const asin = (asinMatch ? asinMatch[1] : (body?.payload?.ASIN || body?.payload?.asin))?.toUpperCase();
                if (!asin) return;

                const summary = body?.payload?.Summary || body?.Summary || body?.payload?.summary;
                const offers = body?.payload?.Offers || body?.Offers || body?.payload?.offers;

                if (!summary) {
                    results[asin] = null;
                    return;
                }

                // Helper to extract amount from price object (Landed or Listing)
                const getAmountFromPrice = (priceObj: any) => {
                    if (priceObj?.LandedPrice?.Amount > 0) return { amount: priceObj.LandedPrice.Amount, currency: priceObj.LandedPrice.CurrencyCode };
                    if (priceObj?.ListingPrice?.Amount > 0) return { amount: priceObj.ListingPrice.Amount, currency: priceObj.ListingPrice.CurrencyCode };
                    if (priceObj?.Price?.Amount > 0) return { amount: priceObj.Price.Amount, currency: priceObj.Price.CurrencyCode };
                    return null;
                };

                const findNewCondition = (items: any[]) => {
                    if (!items || !Array.isArray(items)) return null;
                    return items.find((p: any) => {
                        const condition = (p.Condition || p.condition || p.SubCondition || '').toLowerCase();
                        return condition === 'new';
                    });
                };

                // 1. Primary: BuyBox
                let priceResult = getAmountFromPrice(findNewCondition(summary.BuyBoxPrices));
                let fallbackUsed = false;

                // 2. Secondary: CompetitivePricing (Often contains the Featured/Discounted price)
                if (!priceResult && summary.CompetitivePricing?.CompetitivePrices) {
                    const compPrices = summary.CompetitivePricing.CompetitivePrices;
                    // Look for IDs 1 (New) or 2 (Used) or any Featured Offer
                    const bestComp = compPrices.find((cp: any) => cp.CompetitivePriceId === '1') || compPrices[0];
                    if (bestComp?.Price) {
                        priceResult = getAmountFromPrice(bestComp.Price);
                        if (priceResult) fallbackUsed = true;
                    }
                }

                // 3. Tertiary: Lowest New Price among active Professional Sellers
                if (!priceResult) {
                    const lowestNew = findNewCondition(summary.LowestPrices);
                    priceResult = getAmountFromPrice(lowestNew);
                    if (priceResult) fallbackUsed = true;
                }

                // 4. Quaternary: Detailed Offers list fallback
                if (!priceResult && Array.isArray(offers) && offers.length > 0) {
                    const bestOffer = offers.find((o: any) => o.IsBuyBoxWinner === true) ||
                        offers.find((o: any) => (o.SubCondition || o.Condition) === 'New') ||
                        offers[0];

                    if (bestOffer) {
                        priceResult = getAmountFromPrice(bestOffer); // Handles LandedPrice/ListingPrice
                        if (priceResult) fallbackUsed = true;
                    }
                }

                // 5. Quinary: Global Discovery - Pick ANYTHING from summary that has a price
                if (!priceResult) {
                    const anyLowest = Array.isArray(summary.LowestPrices) ? summary.LowestPrices[0] : null;
                    const anyBuyBox = Array.isArray(summary.BuyBoxPrices) ? summary.BuyBoxPrices[0] : null;
                    const anyComp = (summary.CompetitivePricing?.CompetitivePrices && summary.CompetitivePricing.CompetitivePrices[0]);

                    const lastDitch = anyBuyBox || anyComp || anyLowest;
                    if (lastDitch) {
                        priceResult = getAmountFromPrice(lastDitch);
                        if (priceResult) fallbackUsed = true;
                    }
                }

                if (!priceResult) {
                    results[asin] = null;
                    return;
                }

                results[asin] = {
                    price: priceResult ? priceResult.amount : 0,
                    activeSellers: summary.TotalOfferCount || 0,
                    currency: priceResult ? priceResult.currency : (targetMarketplace === 'A2Q3Y263D00KWC' ? 'BRL' : 'EUR'),
                    fallbackUsed: fallbackUsed
                };
            });
        }

        return results;
    } catch (e) {
        console.error("Error in getBatchOffers:", e);
        return {};
    }
};

export const getItemOffers = async (asin: string, marketplaceId?: string): Promise<{ price: number, activeSellers: number, currency: string } | null> => {
    const targetMarketplace = marketplaceId || 'A1RKKUPIHCS9HS'; // Default ES
    const region = getRegionFromMarketplaceId(targetMarketplace);
    const token = await getValidAccessToken(region);

    if (!token) {
        console.warn(`No token available for region ${region} to fetch offers.`);
        return null;
    }

    const payload = {
        access_token: token,
        marketplaceId: targetMarketplace,
        region: region,
        asin: asin,
        intent: 'get_offers' // Signal proxy to use Pricing API
    };

    try {
        const response = await fetch('/.netlify/functions/amazon-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Error fetching offers for ${asin}:`, data);
            return null;
        }

        const summary = data.payload?.Summary;
        if (!summary) return null;

        // Debugging for specific ASIN
        if (asin === 'B00005BP05' || asin === 'B0D73SSWMX') {
            console.log(`[Pricing Debug] Payload for ${asin}:`, JSON.stringify(summary, null, 2));
        }

        // Helper to extract amount from price object (Landed or Listing)
        const getAmount = (priceObj: any) => {
            if (priceObj?.LandedPrice?.Amount > 0) return { amount: priceObj.LandedPrice.Amount, currency: priceObj.LandedPrice.CurrencyCode };
            if (priceObj?.ListingPrice?.Amount > 0) return { amount: priceObj.ListingPrice.Amount, currency: priceObj.ListingPrice.CurrencyCode };
            return null;
        };

        // Helper to find "New" condition case-insensitively
        const findNewCondition = (items: any[]) => {
            if (!items || !Array.isArray(items)) return null;
            return items.find((p: any) => {
                const condition = p.Condition || p.condition;
                return condition && condition.toLowerCase() === 'new';
            });
        };

        // 1. Try Buy Box (New)
        let buyBoxPriceObj = findNewCondition(summary.BuyBoxPrices);
        let result = getAmount(buyBoxPriceObj);

        // 2. Fallback to Lowest Prices (New)
        if (!result) {
            const lowestNew = findNewCondition(summary.LowestPrices);
            result = getAmount(lowestNew);
        }

        let finalPrice = result ? result.amount : 0;
        let finalCurrency = result ? result.currency : 'USD';

        return {
            price: finalPrice,
            activeSellers: summary.TotalOfferCount || 0,
            currency: finalCurrency
        };

    } catch (e) {
        console.error("Error in getItemOffers:", e);
        return null;
    }
};
