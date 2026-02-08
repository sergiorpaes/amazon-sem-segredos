
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini Flash Latest
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Analyze this product image in detail.
        Identify the key features, materials, colors, and style.
        
        Then, generate 3 distinct image generation prompts for DALL-E 3 / Imagen 3 based on this product, maintaining its core identity but placing it in different professional contexts:
        1. A "Lifestyle" shot (e.g., in use, home setting).
        2. A "Creative" shot (e.g., studio lighting, artistic background).
        3. An "Application" shot (e.g., showing the benefit/result).
        
        ${additionalPrompt ? `User additional context: ${additionalPrompt}` : ''}
        
        Return the result as a STRICT JSON object with these keys:
        {
            "description": "Brief description of the product",
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
