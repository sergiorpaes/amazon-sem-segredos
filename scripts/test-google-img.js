
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';

// Load env (simple hack for test script)
const apiKey = process.env.GEMINI_API_KEY || "PLACEHOLDER_API_KEY"; // Will run with env var

async function testImageGen() {
    console.log("Testing Image Generation with Key:", apiKey ? "Has Key" : "No Key");
    if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
        console.error("Please provide valid GEMINI_API_KEY");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try Imagen 3 model
    const modelName = "imagen-3.0-generate-001";
    // Alterative: "gemini-2.0-flash-exp" (if multimodal out)

    console.log(`Getting model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const prompt = "A futuristic bicycle with neon lights, 3d render";
        console.log(`Generating content with prompt: "${prompt}"`);

        // Attempt standard generateContent - if this is the wrong method for images, it will fail
        const result = await model.generateContent(prompt);

        console.log("Response received!");
        console.log(JSON.stringify(result, null, 2));

        const response = await result.response;
        console.log("Response Text (if any):", response.text());

        // Check for image data in candidates
        // Note: Usage depends on API spec, often image bytes are in 'inlineData' or 'parts'

    } catch (error) {
        console.error("Error generating image:", error);
    }
}

testImageGen();
