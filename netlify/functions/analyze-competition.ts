import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { consumeCredits } from '../../src/lib/credits';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event, context) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { asin, marketplaceId } = body;

        if (!asin) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing ASIN" }) };
        }

        // 1. Auth & Credits
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;
        if (!token) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        let userId: number;
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            userId = decoded.userId;
        } catch (e) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid token" }) };
        }

        // Deduct 5 credits for competition analysis
        try {
            await consumeCredits(userId, 5, 'ANALYZE_COMPETITION', { asin });
        } catch (e: any) {
            return {
                statusCode: 402,
                headers,
                body: JSON.stringify({ error: e.message || 'Insufficient credits', code: 'NO_CREDITS' })
            };
        }

        // 2. Fetch Reviews (Scraping)
        // Marketplace detection (default BR if not specified)
        const domain = marketplaceId === 'A1RKKUPIHCS9HS' ? 'amazon.com.br' : 'amazon.com';
        const reviewsUrl = `https://www.${domain}/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?sortBy=recent`;

        console.log(`[AI Analysis] Scraping reviews from: ${reviewsUrl}`);

        const response = await fetch(reviewsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7'
            }
        });

        const html = await response.text();

        // Basic Regex Extraction for Top 10 negative reviews
        // Amazon reviews are usually inside <span data-hook="review-body">
        const reviewRegex = /<span data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/g;
        const reviews: string[] = [];
        let match;
        while ((match = reviewRegex.exec(html)) !== null && reviews.length < 10) {
            const cleanText = match[1].replace(/<[^>]*>?/gm, '').trim();
            if (cleanText) reviews.push(cleanText);
        }

        console.log(`[AI Analysis] Extracted ${reviews.length} recent reviews for ASIN: ${asin}`);

        if (reviews.length === 0) {
            // Fallback: If no specific critical reviews found, or scraping blocked, inform AI
            // AI can still provide general competition analysis based on item type if we had title, 
            // but let's try to be honest.
        }

        // 3. AI Analysis with Gemini
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `Analyze these ${reviews.length} recent reviews for Amazon product ASIN ${asin}:
        
        REVIEWS:
        ${reviews.join('\n---\n')}
        
        IDENTIFY:
        1. Top 3 recurring complaints (Fraquezas da Concorrência).
        2. Suggest how a new seller can improve this product or listing to beat this competitor (Sua Oportunidade de Melhoria).
        
        RESPONSE FORMAT (JSON):
        {
            "weaknesses": ["Complaint 1", "Complaint 2", "Complaint 3"],
            "improvements": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
            "summary": "Short overview"
        }
        
        Language: Use the language of the user (assume Portuguese BR based on context).`;

        const result = await model.generateContent(prompt);
        const aiText = result.response.text();

        // Extract JSON from AI response (handle potential markdown fences)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response", raw: aiText };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...analysis,
                rawReviews: reviews.slice(0, 5)
            })
        };

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
