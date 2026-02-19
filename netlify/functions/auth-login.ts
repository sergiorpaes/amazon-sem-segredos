import { db } from '../../src/db';
import { users, userSubscriptions, plans, systemConfig } from '../../src/db/schema';
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

        // 0. Check Maintenance Mode
        const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, 'maintenance_mode')).limit(1);
        const isMaintenance = config?.value === 'true';

        // Find user
        const [user] = await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
            credits_balance: users.credits_balance,
            password_hash: users.password_hash,
            activated_at: users.activated_at,
            banned_at: users.banned_at,
            plan_name: plans.name
        })
            .from(users)
            .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.user_id))
            .leftJoin(plans, eq(userSubscriptions.plan_id, plans.id))
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
        }

        // Check if Banned
        if (user.banned_at) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: 'Conta Suspensa',
                    details: 'Sua conta foi suspensa temporariamente ou permanentemente. Entre em contato com o suporte.'
                })
            };
        }

        // Check if Maintenance Mode blocks this user
        if (isMaintenance && user.role !== 'ADMIN') {
            return {
                statusCode: 503,
                body: JSON.stringify({
                    error: 'Sistema em Manutenção',
                    details: 'O sistema está em manutenção programada. Por favor, tente novamente mais tarde.'
                })
            };
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Credenciais inválidas' }) };
        }

        // Check if activated
        if (!user.activated_at && user.role !== 'ADMIN') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Sua conta ainda não foi ativada. Por favor, verifique seu e-mail.' })
            };
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
            path: '/',
        });

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': authCookie,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    credits_balance: user.credits_balance,
                    plan_name: user.plan_name
                }
            })
        };

    } catch (error: any) {
        console.error('Login Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
