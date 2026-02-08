
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    } catch (e) { }
}

if (!apiKey) {
    console.error("API Key not found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        const response = result.response.text();
        console.log(`✅ Success with ${modelName}:`, response.substring(0, 50));
        return true;
    } catch (e) {
        console.log(`❌ Failed with ${modelName}:`, e.message.split('\n')[0]);
        // console.log(e);
        return false;
    }
}

async function runProbe() {
    for (const modelName of modelsToTest) {
        await testModel(modelName);
    }
}

runProbe();
