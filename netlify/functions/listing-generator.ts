
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
        const { productName, category, material, benefits, differentiators, audience, problem, usage } = body;

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
        Você é um especialista em SEO para Amazon, copywriting de alta conversão e marketplaces europeus.
        Seu foco é criar anúncios otimizados para a Amazon Espanha (Amazon.es), respeitando as boas práticas da plataforma e os limites de caracteres.

        Crie um anúncio COMPLETO e OTIMIZADO para Amazon, contendo:

        1️⃣ TÍTULO DO PRODUTO (máx. 200 caracteres)
        - Em ESPANHOL
        - Com as principais palavras-chave no início
        - Otimizado para SEO da Amazon

        2️⃣ BULLET POINTS / CARACTERÍSTICAS (${bulletCount} bullets)
        - Em ESPANHOL
        - ${isPro ? 'Como você é um usuário ELITE (PRO/Premium), gere 10 bullet points extremamente detalhados.' : 'Gere 5 bullet points focados em benefícios.'}
        - Focados em benefícios + diferenciais
        - Linguagem clara, objetiva e persuasiva

        3️⃣ DESCRIÇÃO LONGA
        - Em ESPANHOL
        - Estrutura escaneável
        - Foco em solução de problema, benefícios e uso prático

        4️⃣ VERSÃO EM PORTUGUÊS (PORTUGAL)
        - Título
        - Bullet points (${bulletCount} bullets)
        - Descrição
        - Linguagem adaptada para português europeu (PT-PT)

        5️⃣ PALAVRAS-CHAVE BACKEND (SEARCH TERMS)
        - Lista separada por espaço
        - Otimizada para Amazon ES
        
        📌 INFORMAÇÕES DO PRODUTO:
        - Nome do produto: ${productName}
        - Categoria: ${category}
        - Material: ${material}
        - Principais benefícios: ${benefits}
        - Diferenciais: ${differentiators}
        - Público-alvo: ${audience}
        - Problema: ${problem}
        - Uso: ${usage}
        
        Retorne APENAS o JSON com a estrutura estrita abaixo (sem markdown, sem code blocks):
        {
            "es": { 
                "title": "...", 
                "bullets": ["...", ...], 
                "description": "...",
                "keywords": "..." 
            },
            "pt": { 
                "title": "...", 
                "bullets": ["...", ...], 
                "description": "...",
                "keywords": "..." 
            },
            "imagePromptContext": "Short visual description for image generation (in English)"
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (isDebug) {
            console.log('[DEBUG] Listing Generator Response:', { responseLength: responseText.length });
        }

        // Clean and Parse
        let jsonString = responseText.trim();

        // Try to find JSON block if markdown is present
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON:", jsonString);
            throw new Error("Invalid JSON format from AI model");
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
