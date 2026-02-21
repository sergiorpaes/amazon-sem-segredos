
import { SavedListing, ListingGeneratorResult } from '../types';

export const saveListing = async (productName: string, listingData: ListingGeneratorResult, generatedImages: string[]): Promise<SavedListing> => {
    const res = await fetch('/.netlify/functions/save-listing', {
        method: 'POST',
        body: JSON.stringify({ productName, listingData, generatedImages }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Save Listing Failed:', errorData);
        throw new Error(errorData.details || errorData.message || 'Failed to save listing');
    }

    return await res.json();
};

export const getListings = async (): Promise<SavedListing[]> => {
    const res = await fetch('/.netlify/functions/get-listings');

    if (!res.ok) {
        throw new Error('Failed to fetch listings');
    }

    const data = await res.json();
    // console.log('API getListings RAW:', data);

    // Map backend response (id, product_name, listing_data, generated_images, created_at) 
    // to frontend interface (id, productName, listing_data -> es/pt, generatedImages, createdAt)
    return data.map((item: any) => {
        // console.log('Processing item:', item); 
        return {
            id: item.id.toString(),
            productName: item.product_name,
            es: item.listing_data?.es,
            pt: item.listing_data?.pt,
            imagePromptContext: item.listing_data?.imagePromptContext,
            generatedImages: item.generated_images || [],
            createdAt: item.created_at
        };
    });
};

export const deleteListing = async (id: string): Promise<void> => {
    const res = await fetch('/.netlify/functions/delete-listing', {
        method: 'POST',
        body: JSON.stringify({ id }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
        throw new Error('Failed to delete listing');
    }
};
