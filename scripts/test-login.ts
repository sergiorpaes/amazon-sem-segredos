
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing the handler
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testLogin() {
    // Dynamic import to ensure env vars are loaded first
    const { handler } = await import('../netlify/functions/auth-login');

    const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        })
    };

    try {
        console.log('Testing login handler...');
        const response = await handler(mockEvent as any, {} as any, () => { });
        console.log('Response status:', response?.statusCode);

        if (response?.statusCode === 500) {
            console.log('Body:', response.body);
        } else if (response?.statusCode === 200) {
            console.log('Success! User found.');
        } else {
            console.log('Response:', response);
        }

    } catch (error) {
        console.error('Handler execution failed:', error);
    }
}

testLogin();
