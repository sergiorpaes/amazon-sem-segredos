import { ListingGeneratorResult } from '../types';

interface ListingInput {
    productName: string;
    category: string;
    material: string;
    benefits: string;
    differentiators: string;
    audience: string;
    problem: string;
    usage: string;
}

export const generateListing = async (data: ListingInput): Promise<ListingGeneratorResult> => {
    try {
        const response = await fetch('/.netlify/functions/listing-generator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("Listing Generation Error:", error);
        throw new Error(error.message || "Failed to generate listing.");
    }
};
