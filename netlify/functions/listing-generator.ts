
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits } from '../../src/lib/credits';
import { db } from '../../src/db';
import { systemConfig, plans, userSubscriptions } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

export const handler = async (event: any) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Verify Auth
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    let userId: number;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
        userId = decoded.userId;
    } catch (e) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid Token' })
        };
    }

    try {
        // Consume Credits for LISTING_CREATOR (5 credits)
        await consumeCredits(userId, 5, 'LISTING_CREATOR');
    } catch (error: any) {
        return {
            statusCode: 402,
            body: JSON.stringify({ error: error.message || 'Insufficient credits' })
        };
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing API Key' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { productName, category, material, benefits, differentiators, audience, problem, usage, language = 'pt' } = body;

        if (!productName || !category) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Product Name and Category are required.' }) };
        }

        // Fetch Global Settings
        const allConfigs = await db.select().from(systemConfig);
        const configMap: Record<string, string> = {};
        allConfigs.forEach(c => configMap[c.key] = c.value);

        const aiModel = configMap.ai_model || "gemini-2.0-flash-lite";
        const isDebug = configMap.debug_mode === 'true';

        // --- PLAN DETECTION ---
        let userPlan = 'Free';
        try {
            const [subscription] = await db
                .select({ planName: plans.name })
                .from(userSubscriptions)
                .innerJoin(plans, eq(userSubscriptions.plan_id, plans.id))
                .where(and(
                    eq(userSubscriptions.user_id, userId),
                    eq(userSubscriptions.status, 'active')
                ))
                .limit(1);

            if (subscription) {
                userPlan = subscription.planName;
            }
        } catch (planErr) {
            console.warn("[WARN] Failed to fetch user plan, defaulting to Free:", planErr);
        }

        const isPro = userPlan.toLowerCase().includes('pro') || userPlan.toLowerCase().includes('premium');
        const bulletCount = isPro ? 10 : 5;

        if (isDebug) {
            console.log('[DEBUG] Listing Generator Request:', { productName, model: aiModel, plan: userPlan, bullets: bulletCount });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: aiModel });

        // --- SINGLE OPTIMIZED PROMPT ---
        const prompt = `
        Você é um especialista em SEO para Amazon e copywriting de alta conversão.
        Sua tarefa é criar um anúncio para Amazon em DOIS idiomas simultâneos: **Espanhol** e **Português (Portugal)**.

        ESTRUTURA DO ANÚNCIO PARA CADA IDIOMA:
        1. TÍTULO DO PRODUTO (máx. 200 caracteres)
        2. BULLET POINTS / CARACTERÍSTICAS (${bulletCount} bullets)
           ${isPro ? "- Como o usuário é PRO/Premium, gere EXATAMENTE 10 bullets longos, persuasivos e extremamente detalhados com palavras-chave incorporadas, cobrindo todos os casos de uso imagináveis." : "- Gere EXATAMENTE 5 bullets focados nos benefícios principais."}
        3. DESCRIÇÃO LONGA (Estrutura escaneável)
           ${isPro ? "- Como o usuário é PRO/Premium, crie uma descrição LONGA e PROFUNDA (mínimo 4-5 parágrafos ou seções), incluindo storytelling da marca, cenário de uso, perguntas frequentes no meio do texto e máxima densidade de SEO." : "- Crie uma descrição padrão, clara e concisa (2-3 parágrafos)."}
        4. PALAVRAS-CHAVE BACKEND (SEARCH TERMS - Lista separada por espaço)

        📌 INFORMAÇÕES DO PRODUTO:
        - Nome: ${productName}
        - Categoria: ${category}
        - Material: ${material}
        - Benefícios: ${benefits}
        - Diferenciais: ${differentiators}
        - Público-alvo: ${audience}
        - Problema: ${problem}
        - Uso: ${usage}
        
        Retorne APENAS um JSON com esta estrutura (sem markdown):
        {
            "es": { "title": "...", "bullets": ["...", ...], "description": "...", "keywords": "..." },
            "pt": { "title": "...", "bullets": ["...", ...], "description": "...", "keywords": "..." },
            "imagePromptContext": "Short visual description for image generation (in English)"
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (isDebug) {
            console.log('[DEBUG] Listing Generator Response:', { responseLength: responseText.length });
        }

        // Clean and Parse
        let jsonResponse;
        try {
            // Remove markdown code blocks if present
            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Try to find the first '{' and last '}'
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No JSON object found in response");
            }

            const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
            jsonResponse = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON response:", responseText);

            // Fallback: If JSON parsing fails, return a simulated response if we have enough info
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'AI JSON Parsing Error',
                    details: 'O modelo IA retornou um formato inesperado. Tente novamente.',
                    raw: isDebug ? responseText : undefined
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonResponse)
        };

    } catch (error: any) {
        console.error("Listing Generator Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
