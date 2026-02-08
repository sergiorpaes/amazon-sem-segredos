
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

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return { statusCode: 409, body: JSON.stringify({ error: 'User already exists' }) };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with 5 free credits
        const [newUser] = await db.insert(users).values({
            email,
            password_hash: passwordHash,
            role: 'USER',
            credits_balance: 5,
        }).returning();

        // Generate JWT
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role },
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
            statusCode: 201,
            headers: {
                'Set-Cookie': authCookie,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: { id: newUser.id, email: newUser.email, role: newUser.role, credits: newUser.credits_balance } })
        };

    } catch (error: any) {
        console.error('Signup Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
