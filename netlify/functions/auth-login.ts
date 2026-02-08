
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Email and password are required' }) };
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret-dev-key',
            { expiresIn: '7d' }
        );

        // Set Cookie
        const authCookie = cookie.serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': authCookie,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: { id: user.id, email: user.email, role: user.role, credits: user.credits_balance } })
        };

    } catch (error: any) {
        console.error('Login Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
