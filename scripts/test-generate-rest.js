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

if (!apiKey) {
    console.error("API Key not found");
    process.exit(1);
}

const prompt = "A futuristic eco-friendly water bottle on a white background, studio lighting, 4k";

// Use one of the available models found in list-models.js
// models/imagen-4.0-fast-generate-001 (predict)
const modelName = "imagen-4.0-fast-generate-001";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

const payload = {
    instances: [
        { prompt: prompt }
    ],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
    }
};

async function testGenerate() {
    console.log(`Testing ${modelName} with prompt: "${prompt}"`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error ${response.status}: ${response.statusText}`);
            console.error("Details:", errorText);
            return;
        }

        const data = await response.json();
        console.log("Success! Response structure:");
        // Don't log full base64 to console
        if (data.predictions && data.predictions.length > 0) {
            console.log("Predictions received:", data.predictions.length);
            const firstPred = data.predictions[0];
            const b64 = firstPred.bytesBase64Encoded || firstPred.mimeType ? "Base64 Data Present" : "Unknown Format";
            console.log("First prediction format:", b64);
            // console.log(JSON.stringify(data, null, 2)); 
        } else {
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testGenerate();
