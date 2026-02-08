import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import crypto from 'node:crypto';
import { sendWelcomeEmail } from './utils/email';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const {
            email,
            password,
            phone,
            company_name,
            address_street,
            address_city,
            address_state,
            address_zip
        } = JSON.parse(event.body);

        if (!email || !password || !phone || !address_street) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Faltam campos obrigatórios (Email, Password, Telefone, Morada)' }) };
        }

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return { statusCode: 409, body: JSON.stringify({ error: 'Usuário já existe' }) };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with 5 free credits and activation token
        const activationToken = crypto.randomUUID();

        const [newUser] = await db.insert(users).values({
            email,
            password_hash: passwordHash,
            role: 'USER',
            credits_balance: 5,
            phone,
            company_name,
            address_street,
            address_city,
            address_state,
            address_zip,
            activation_token: activationToken,
        }).returning();

        // 📧 Send Welcome Email with activation link
        const host = event.headers.host || 'localhost:8888';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const activationUrl = `${protocol}://${host}/activate?token=${activationToken}`;

        await sendWelcomeEmail(email, activationUrl);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Usuário criado com sucesso. Por favor, verifique seu e-mail para ativar sua conta.',
                user: { id: newUser.id, email: newUser.email, role: newUser.role, activated: false }
            })
        };

    } catch (error: any) {
        console.error('Signup Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao processar cadastro. Por favor, tente novamente.' }) };
    }
};
