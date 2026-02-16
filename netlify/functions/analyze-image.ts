
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../../src/db';
import { systemConfig, plans, userSubscriptions } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    // 1. Broadest possible Error Handling
    try {
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
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Verify Auth & Get UserID
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;
        if (!token) {
            return {
                statusCode: 401,
                headers: { 'Access-Control-Allow-Origin': '*' },
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
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid Token' })
            };
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            console.error("[CRITICAL] Missing Gemini API Key");
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Server configuration error: Missing API Key' })
            };
        }

        // Parse Body safely
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (e) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid JSON body' })
            };
        }

        const { image, additionalPrompt } = body;
        if (!image) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Image is required' })
            };
        }

        // Robust MIME and Base64 extraction
        let mimeType = "image/jpeg";
        let base64Image = image;

        if (image.includes(';base64,')) {
            const parts = image.split(';base64,');
            if (parts.length === 2) {
                const mimeMatch = parts[0].match(/data:([^;]+)/);
                if (mimeMatch) mimeType = mimeMatch[1];
                base64Image = parts[1];
            }
        }

        // Supported Gemini Image types
        const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        const effectiveMimeType = supportedTypes.includes(mimeType) ? mimeType : "image/jpeg";

        // Configuration with safe fallbacks
        let aiModel = "gemini-1.5-flash";
        let isDebug = false;
        let userPlan = 'Free';

        try {
            const allConfigs = await db.select().from(systemConfig);
            const configMap: Record<string, string> = {};
            allConfigs.forEach(c => configMap[c.key] = c.value);

            aiModel = configMap.ai_model || aiModel;
            isDebug = configMap.debug_mode === 'true';

            // Plan Detection
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
        } catch (dbErr) {
            console.warn("[WARN] DB Config/Plan fetch failed in analyze-image, using defaults:", dbErr);
        }

        const isPro = userPlan.toLowerCase().includes('pro') || userPlan.toLowerCase().includes('premium');

        if (isDebug) {
            console.log('[DEBUG] Analyze Image Request:', {
                userId,
                model: aiModel,
                plan: userPlan,
                mimeType: effectiveMimeType,
                imageLength: base64Image.length
            });
        }

        // Gemini Call with Robust Error Recovery
        const genAI = new GoogleGenerativeAI(apiKey);

        async function tryGenerate(modelName: string) {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { temperature: 0.4 }
            });

            const prompt = `
            Atue como um Especialista em Catalogação de E-commerce da Amazon. Sua tarefa é analisar a imagem enviada por um vendedor e gerar os termos de busca técnicos que retornarão o produto exato ou seus concorrentes diretos na Amazon.

            DIRETRIZES DE ANÁLISE:
            1. IDENTIFICAÇÃO DE TEXTO (OCR): Extraia prioritariamente nomes de marcas, logotipos, códigos de modelo (ex: WH-1000XM4), números de peça (MPN) ou voltagem/capacidade.
            2. ATRIBUTOS COMERCIAIS: Identifique cor oficial, material, público-alvo (masculino/feminino/infantil) e quantidade (ex: Pack de 2).
            3. FILTRAGEM DE RUÍDO: Ignore elementos de fundo, mãos do vendedor ou objetos irrelevantes na cena. Foque 100% no item principal.
            4. CATEGORIZAÇÃO: Determine a qual departamento da Amazon o item pertence (Eletrônicos, Cozinha, Ferramentas, etc).

            ${additionalPrompt ? `Contexto adicional do usuário: ${additionalPrompt}` : ''}
            
            Generate ${isPro ? '6' : '3'} distinct image generation prompts for DALL-E 3 / Imagen 3 based on this product.
            ${isPro ? `
            Como o usuário é PRO/Premium, gere 6 prompts em 2 categorias:
            
            CATEGORIA 1: LIFESTYLE (3 imagens)
            - Lifestyle: In use, home/office setting.
            - Creative: Studio lighting, artistic background.
            - Application: Showing the benefit/result.

            CATEGORIA 2: INFOGRÁFICOS TÉCNICOS (3 imagens)
            - Dimensions: White background, product only, with technical arrows and dimension text (e.g., "14cm / 5.51inch").
            - Features Callout: Product detail with text overlays pointing to features (e.g., "Stainless Steel Blade", "Safety Lock").
            - Exploded View: Parts separated clearly with labels for each component.
            ` : `
            Gere 3 prompts de estilo Lifestyle:
            1. A "Lifestyle" shot (e.g., in use, home setting).
            2. A "Creative" shot (e.g., studio lighting, artistic background).
            3. An "Application" shot (e.g., showing the benefit/result).
            `}

            Return the result as a STRICT JSON object with these keys:
            {
              "amazon_optimized_query": "[MARCA] + [MODELO EXATO] + [PRINCIPAL CARACTERÍSTICA] + [COR/TAMANHO]",
              "detected_brand": "Nome da Marca",
              "product_category": "Categoria sugerida para o SearchIndex",
              "technical_details": ["detalhe 1", "detalhe 2"],
              "confidence_score": "0-100",
              "description": "Brief literal description in Portuguese",
              "prompts": {
                    "lifestyle": "Full prompt...",
                    "creative": "Full prompt...",
                    "application": "Full prompt..."
                    ${isPro ? `,
                    "dimensions": "Full prompt for infographic with dimensions...",
                    "features": "Full prompt with feature callouts and text...",
                    "exploded": "Full prompt showing exploded view of components..."
                    ` : ''}
              }
            }
            Do not use markdown formatting.
            `;

            return await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: effectiveMimeType,
                    },
                },
            ]);
        }

        let result;
        const modelsToTry = [aiModel, "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-lite"];
        const uniqueModels = [...new Set(modelsToTry)];

        let lastError: any;
        for (const modelName of uniqueModels) {
            try {
                if (isDebug) console.log(`[DEBUG] Attempting with model: ${modelName}`);
                result = await tryGenerate(modelName);
                if (result) break;
            } catch (err: any) {
                lastError = err;
                console.warn(`[WARN] Model ${modelName} failed:`, err.message);
                if (err.message?.includes('404') || err.message?.includes('not found')) {
                    continue;
                }
                throw err;
            }
        }

        if (!result) {
            throw lastError || new Error("All models failed to respond");
        }

        const response = await result.response;
        const responseText = response.text();

        // Clean and Parse AI response
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanText);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonResponse)
        };

    } catch (error: any) {
        console.error("[FATAL] analyze-image handler error:", error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            })
        };
    }
};
