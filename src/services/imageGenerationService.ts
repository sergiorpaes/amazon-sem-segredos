

export interface AnalysisResponse {
    description: string;
    amazon_optimized_query?: string;
    detected_brand?: string;
    product_category?: string;
    technical_details?: string[];
    confidence_score?: string;
    prompts: {
        lifestyle: string;
        creative: string;
        application: string;
    };
}

interface ImageResponse {
    image: string; // Base64 Data URL
    error?: string;
}

export interface GenerationResult {
    analysis?: AnalysisResponse;
    images: string[];
    error?: string;
}

export const generateListingImages = async (userPrompt: string, imageBase64: string | null): Promise<GenerationResult> => {
    if (!imageBase64) {
        throw new Error("Image is required for analysis.");
    }

    try {
        // 1. Analyze Image (Gemini)
        const analysisRes = await fetch('/.netlify/functions/analyze-image', {
            method: 'POST',
            body: JSON.stringify({
                image: imageBase64,
                additionalPrompt: userPrompt
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!analysisRes.ok) {
            const err = await analysisRes.json();
            throw new Error(err.error || "Failed to analyze image");
        }

        const analysisData: AnalysisResponse = await analysisRes.json();
        console.log("Analysis Result:", analysisData);

        // 2. Generate Images (Gemini/Imagen)
        const promptTypes = ['lifestyle', 'creative', 'application'] as const;
        const generatePromises = promptTypes.map(async (type) => {
            const prompt = analysisData.prompts[type];
            try {
                const res = await fetch('/.netlify/functions/generate-images', {
                    method: 'POST',
                    body: JSON.stringify({ prompt }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error(`Failed to generate ${type} image:`, errData);
                    // Check for billing error specifically
                    if (res.status === 403 || (errData.error && errData.error.includes("billed"))) {
                        throw new Error(errData.error || "Billing required for images");
                    }
                    return null;
                }

                const data: ImageResponse = await res.json();
                return data.image; // Should be data:image/png;base64,...
            } catch (e: any) {
                console.error(`Error generating ${type} image:`, e);
                // Propagate specific billing error if found
                if (e.message && (e.message.includes("Billing") || e.message.includes("billed"))) {
                    throw e;
                }
                return null;
            }
        });

        // We wait for all, but if one throws a billing error, we want to catch it to report it,
        // but we still want to return the analysis.
        // `Promise.all` fails fast. `Promise.allSettled` is better here? 
        // Actually, let's just catch individual errors inside the map and return a special marker or throw?
        // Let's use `Promise.all` but catch inside the map to return null on *generic* error, 
        // but if we detect a billing error, we might want to flag the whole result as "image generation blocked".

        // Revised approach:
        const results = await Promise.allSettled(generatePromises);

        const validImages: string[] = [];
        let billingError: string | undefined;

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value) validImages.push(result.value);
            } else {
                // If it was rejected (from our throw above), check message
                if (result.reason.message && (result.reason.message.includes("Billing") || result.reason.message.includes("billed"))) {
                    billingError = result.reason.message;
                }
            }
        });

        if (validImages.length === 0 && billingError) {
            return {
                analysis: analysisData,
                images: [],
                error: billingError
            };
        }

        if (validImages.length === 0 && !billingError) {
            // Generic failure
            return {
                analysis: analysisData,
                images: [],
                error: "Failed to generate images. Please try again."
            };
        }

        return {
            analysis: analysisData,
            images: validImages
        };

    } catch (error: any) {
        console.error("Image Generation Service Error:", error);
        // If analysis failed, we throw. 
        // If generation failed partly, we handled it above.
        throw error;
    }
};

