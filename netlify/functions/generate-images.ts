
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
        const { prompt } = body;

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required' })
            };
        }

        // Using Imagen 4.0 Fast via REST API (Standard for Billed Accounts)
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

        // Generate Image via REST
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
                console.error(`Imagen API Error (${response.status}):`, errorText);

                let errorMessage = "Failed to generate image.";
                if (response.status === 403 || errorText.includes("billing")) {
                    errorMessage = "Image generation requires a billed Google Cloud project/API key.";
                } else if (response.status === 404) {
                    errorMessage = "Image generation model not found. API key might be restricted.";
                } else if (response.status === 429) {
                    errorMessage = "Quota exceeded for image generation.";
                }

                return {
                    statusCode: response.status === 400 || response.status === 403 || response.status === 404 ? 403 : 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        error: errorMessage,
                        details: errorText
                    })
                };
            }

            const data = await response.json();

            let base64Image = null;
            if (data.predictions && data.predictions.length > 0) {
                const prediction = data.predictions[0];
                // Check for bytesBase64Encoded (standard) or mimeType/bytes (sometimes)
                if (prediction.bytesBase64Encoded) {
                    base64Image = prediction.bytesBase64Encoded;
                } else if (prediction.mimeType && prediction.bytesBase64Encoded) {
                    base64Image = prediction.bytesBase64Encoded;
                }
            }

            if (!base64Image) {
                console.error("No image data in response:", JSON.stringify(data).substring(0, 500));
                throw new Error("No image data returned from API.");
            }

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: `data:image/png;base64,${base64Image}`
                })
            };

        } catch (genError: any) {
            console.error("Fetch/Network Error:", genError);
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: "Network error during image generation.",
                    details: genError.message
                })
            };
        }

    } catch (error: any) {
        console.error("Handler Error:", error);
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
