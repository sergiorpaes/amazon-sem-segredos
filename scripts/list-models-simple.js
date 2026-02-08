
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

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function list() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}
list();
