/**
 * Utility to resize an image using an HTML canvas, reducing its resolution and quality
 * to minimize the payload size for API requests and speed up AI processing.
 *
 * @param fileOrDataUrl File object or base64 DataURL
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality JPEG compression quality (0 to 1)
 * @returns Promise resolving to a compressed base64 JPEG DataURL
 */
export const compressImage = async (
    fileOrDataUrl: File | string,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions keeping aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Export to base64 with quality reduction
            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve(base64);
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));

        // Load image data
        if (fileOrDataUrl instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(fileOrDataUrl);
        } else {
            img.src = fileOrDataUrl;
        }
    });
};
