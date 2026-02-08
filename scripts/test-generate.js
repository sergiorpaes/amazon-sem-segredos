
const prompt = "A futuristic bicycle with neon lights, 3d render";

console.log("Sending request to generate-images...");

fetch('http://localhost:9999/.netlify/functions/generate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
})
    .then(async res => {
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        if (res.ok) {
            console.log("Image generated successfully!");
            // console.log("Image Data Length:", data.image.length);
        } else {
            console.log("Error Response:", JSON.stringify(data, null, 2));
        }
    })
    .catch(err => {
        console.error("Error:", err);
    });
