
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API Key
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

if (!apiKey) {
    console.error("API Key not found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Use gemini-2.0-flash as updated in the function
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function runTest() {
    console.log("Starting generation test with gemini-2.0-flash...");
    const startTime = Date.now();

    const productName = "Garrafa de Água Térmica Inteligente";
    const category = "Esportes e Ar Livre";
    const material = "Aço Inoxidável";
    const benefits = "Mantém temperatura por 24h, Display LED de temperatura";
    const differentiators = "Design moderno, bateria de longa duração";
    const audience = "Atletas, estudantes, profissionais";
    const problem = "Bebidas esquentam rápido ou esfriam rápido";
    const usage = "Hidratação diária, academia, escritório";

    const prompt = `
    Você é um especialista em SEO para Amazon, copywriting de alta conversão e marketplaces europeus.
    Seu foco é criar anúncios otimizados para a Amazon Espanha (Amazon.es), respeitando as boas práticas da plataforma e os limites de caracteres.

    Crie um anúncio COMPLETO e OTIMIZADO para Amazon, contendo:

    1️⃣ TÍTULO DO PRODUTO (máx. 200 caracteres)
    - Em ESPANHOL
    - Com as principais palavras-chave no início
    - Claro, direto, sem promessas proibidas
    - Otimizado para SEO da Amazon

    2️⃣ BULLET POINTS / CARACTERÍSTICAS (5 bullets)
    - Em ESPANHOL
    - Focados em benefícios + diferenciais (Os 2 primeiros devem ser mais agressivos em benefícios)
    - Linguagem clara, objetiva e persuasiva
    - Usar palavras-chave secundárias de forma natural

    3️⃣ DESCRIÇÃO LONGA
    - Em ESPANHOL
    - Estrutura escaneável
    - Foco em solução de problema, benefícios e uso prático
    - Otimizada para SEO da Amazon

    4️⃣ VERSÃO EM PORTUGUÊS (PORTUGAL)
    - Título
    - Bullet points
    - Descrição
    - Linguagem adaptada para português europeu (PT-PT)

    5️⃣ PALAVRAS-CHAVE BACKEND (SEARCH TERMS)
    - Lista separada por espaço
    - Sem repetição de palavras do título
    - Sem marcas concorrentes
    - Otimizada para Amazon ES
    - Misturar espanhol + português (melhorar indexação para cauda longa)

    📌 INFORMAÇÕES DO PRODUTO:
    - Nome do produto: ${productName}
    - Categoria: ${category}
    - Material: ${material}
    - Principais benefícios: ${benefits}
    - Diferenciais em relação aos concorrentes: ${differentiators}
    - Público-alvo: ${audience}
    - Problema que o produto resolve: ${problem}
    - Uso principal: ${usage}

    📌 REGRAS IMPORTANTES:
    - Não usar emojis no Título
    - Não usar promessas médicas ou proibidas pela Amazon
    - Não mencionar preços, garantias ou envios
    - Linguagem profissional e orientada à conversão
    - SEO voltado para o mercado espanhol, mas com apoio ao público português
    
    Retorne APENAS o JSON com a estrutura estrita abaixo (sem markdown, sem code blocks):
    {
        "es": { 
            "title": "...", 
            "bullets": ["...", ...], 
            "description": "..." 
        },
        "pt": { 
            "title": "...", 
            "bullets": ["...", ...], 
            "description": "..." 
        },
        "keywords": "...",
        "imagePromptContext": "Descrição visual curta do produto para gerar imagens (em inglês)"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const duration = (Date.now() - startTime) / 1000;

        console.log(`Generation completed in ${duration.toFixed(2)}s`);
        console.log("Response length:", response.length);

        // Basic validation
        try {
            let jsonString = response.trim();
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonString = jsonMatch[0];
            const parsed = JSON.parse(jsonString);
            console.log("JSON is valid");
            console.log("Keys present:", Object.keys(parsed));
        } catch (e) {
            console.error("JSON is invalid");
            console.log("Raw output:", response.substring(0, 500) + "...");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

runTest();
