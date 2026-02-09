
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { consumeCredits } from '../../src/lib/credits';

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
        // Consume Credits for MENTOR_VIRTUAL (2 credits)
        await consumeCredits(userId, 2, 'MENTOR_VIRTUAL');
    } catch (error: any) {
        return {
            statusCode: 402, // Payment Required
            body: JSON.stringify({ error: error.message || 'Insufficient credits' })
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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            systemInstruction: instructions
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

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
                message: error.message || error.toString()
            })
        };
    }
};
