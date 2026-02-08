
import fs from 'fs';
import path from 'path';

// Read the uploaded image
const imagePath = 'C:/Users/s.r.silva/.gemini/antigravity/brain/8a5ad9c3-89a6-49af-b490-c6b81c03e99d/uploaded_media_1770531597126.png';

try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    const payload = {
        image: dataUrl,
        additionalPrompt: "Test analysis"
    };

    console.log("Sending request to analyze-image...");

    fetch('http://localhost:9999/.netlify/functions/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            console.log(`Status: ${res.status}`);
            const data = await res.json();
            console.log("Response:", JSON.stringify(data, null, 2));
        })
        .catch(err => {
            console.error("Error:", err);
        });

} catch (err) {
    console.error("Failed to read image:", err);
}
