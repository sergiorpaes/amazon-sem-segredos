
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to read .env.local
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim();
            }
        }
    } catch (e) {
        console.error("Error reading .env.local:", e);
    }
}

const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        productName: "Garrafa Térmica Inteligente",
        category: "Cozinha",
        material: "Aço Inoxidável",
        benefits: "Mantém temperatura por 24h, display LED com temperatura, tampa à prova de vazamentos",
        differentiators: "Display touch, bateria de longa duração, design minimalista",
        audience: "Praticantes de atividade física, escritórios",
        problem: "Bebidas esquentam rápido ou esfriam rápido",
        usage: "Hidratação diária, café, água gelada"
    })
};

// Import the handler dynamically to simulate execution (or just mock the fetch if we were calling the URL)
// Since it's a netlify function not a standalone script, we might need to import it or just run the logic.
// Simpler: use the actual endpoint logic in a script or call the deployed/local server if running.
// But the server isn't running with this new function yet unless we restart.
// So we will just run the logic by importing it? No, it's TS.
// We will simply run a script that performs the same logic with GoogleGenerativeAI to test the PROMPTS.

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testPrompts() {
    if (!apiKey) {
        console.error("API Key missing");
        return;
    }

    console.log("Testing Prompt Logic...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const productName = "Garrafa Térmica";
    // ... (rest of inputs)

    const prompt1 = `
    Você é um especialista em SEO para Amazon...
    PIN: Nome: ${productName}, Categoria: Cozinha...
    Retorne APENAS JSON.
    `;

    // Note: I will just call the actual logic through a simplified script that mimics the function
    // to verify the PROMPTS work and JSON is parsable.

    // Actually, checking the server is better.
}

// Let's just create a script that calls the netlify function logic directly using the same code structure.
// Copy paste logic for testing.

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        console.log("--- Generating Step 1 ---");
        const prompt1 = `
        Crie um anúncio OTIMIZADO para Amazon Espanha (Amazon.es).
        Nome: Garrafa Térmica Inteligente
        Benefícios: Mantém temperatura 24h, LED indicador.
        
        Retorne APENAS JSON:
        { "es": { "title": "...", "bullets": [], "description": "..." }, "pt": { ... } }
        `;

        const result1 = await model.generateContent(prompt1);
        const text1 = result1.response.text();
        console.log("Step 1 Output Length:", text1.length);

        console.log("--- Generating Step 2 (Refinement) ---");
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: prompt1 }] },
                { role: "model", parts: [{ text: text1 }] }
            ]
        });

        const prompt2 = `
        Agora ajuste para Amazon Ads e Keywords de cauda longa.
        Retorne APENAS o JSON final atualizado.
        `;

        const result2 = await chat.sendMessage(prompt2);
        const text2 = result2.response.text();
        console.log("Step 2 Output Length:", text2.length);

        const cleanText = text2.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const json = JSON.parse(cleanText);
            console.log("JSON Parsed Successfully!");
            console.log("Title ES:", json.es.title);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", text2);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
