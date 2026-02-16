

export interface AnalysisResponse {
    description: string;
    amazon_optimized_query?: string;
    detected_brand?: string;
    product_category?: string;
    technical_details?: string[];
    confidence_score?: string;
    prompts: Record<string, string>; // Dynamic prompts (e.g., lifestyle, creative, dimensions, etc.)
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
            const errMsg = err.message || err.error || "Failed to analyze image";
            const errDetails = err.details ? `\nDetails: ${err.details}` : "";
            throw new Error(`${errMsg}${errDetails}`);
        }

        const analysisData: AnalysisResponse = await analysisRes.json();
        console.log("Analysis Result:", analysisData);

        // 2. Generate Images (Gemini/Imagen)
        const promptKeys = Object.keys(analysisData.prompts || {});

        const generatePromises = promptKeys.map(async (key) => {
            const prompt = analysisData.prompts[key];
            try {
                const res = await fetch('/.netlify/functions/generate-images', {
                    method: 'POST',
                    body: JSON.stringify({ prompt }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error(`Failed to generate ${key} image:`, errData);
                    if (res.status === 403 || (errData.error && errData.error.includes("billed"))) {
                        throw new Error(errData.error || "Billing required for images");
                    }
                    return null;
                }

                const data: ImageResponse = await res.json();
                return data.image;
            } catch (e: any) {
                console.error(`Error generating ${key} image:`, e);
                if (e.message && (e.message.includes("Billing") || e.message.includes("billed"))) {
                    throw e;
                }
                return null;
            }
        });

        const results = await Promise.allSettled(generatePromises);

        const validImages: string[] = [];
        let billingError: string | undefined;

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value) validImages.push(result.value);
            } else {
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
        throw error;
    }
};

