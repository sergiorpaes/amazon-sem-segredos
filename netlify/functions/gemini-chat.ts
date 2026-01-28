
import { GoogleGenAI } from "@google/genai";

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
            console.error("Missing Gemini/Google API Key");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing API Key' })
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { message, history, instructions } = body;

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Transform history to Gemini format if needed, but the client should send it correctly
        // Format expected: { role: 'user' | 'model', parts: [{ text: string }] }[]

        const chat = ai.chats.create({
            model: 'models/gemini-1.5-flash',
            config: {
                systemInstruction: instructions, // Dynamic system prompt
            },
            history: history || [],
        });

        const result = await chat.sendMessage(message);

        const responseText = result.text;

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                response: responseText
            })
        };

    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
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
