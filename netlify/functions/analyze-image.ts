
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../../src/db';
import { systemConfig } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

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

        try {
            const allConfigs = await db.select().from(systemConfig);
            const configMap: Record<string, string> = {};
            allConfigs.forEach(c => configMap[c.key] = c.value);

            aiModel = configMap.ai_model || aiModel;
            isDebug = configMap.debug_mode === 'true';
        } catch (dbErr) {
            console.warn("[WARN] DB Config fetch failed in analyze-image, using defaults:", dbErr);
        }

        if (isDebug) {
            console.log('[DEBUG] Analyze Image Request:', {
                model: aiModel,
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
            
            Generate 3 distinct image generation prompts for DALL-E 3 / Imagen 3 based on this product, maintaining its core identity but placing it in different professional contexts:
            1. A "Lifestyle" shot (e.g., in use, home setting).
            2. A "Creative" shot (e.g., studio lighting, artistic background).
            3. An "Application" shot (e.g., showing the benefit/result).

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
        // Remove duplicates and keep order
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
                    continue; // Try next model
                }
                throw err; // If it's another error (like auth or quota), throw immediately
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
