
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../../src/db';
import { systemConfig } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

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

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            console.error("Missing Gemini API Key");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing API Key' })
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { image, additionalPrompt } = body;

        if (!image) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Image is required' })
            };
        }

        // Clean base64 string
        const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

        // Fetch Global Settings
        const allConfigs = await db.select().from(systemConfig);
        const configMap: Record<string, string> = {};
        allConfigs.forEach(c => configMap[c.key] = c.value);

        const aiModel = configMap.ai_model || "gemini-1.5-flash";
        const isDebug = configMap.debug_mode === 'true';

        if (isDebug) {
            console.log('[DEBUG] Analyze Image Request:', { model: aiModel });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: aiModel });

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

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg", // Assuming JPEG for simplicity, or detect from header
                },
            },
        ]);

        const responseText = result.response.text();

        // Clean markdown if present
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
        console.error("Analysis Error:", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};
