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
        address_street,
            address_city,
            address_state,
            address_zip,
            selectedPlan
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

    // Determine initial credits and role based on plan
    let initialCredits = 5; // Default for Starter
    let role = 'USER';

    if (selectedPlan === 'pro' || selectedPlan === 'premium') {
        initialCredits = 0; // Credits will be added after successful payment/webhook
        // Note: We might want to set a 'PENDING' status or similar if the schema supported it,
        // but for now we'll create the user and they'll be 'PRO' or 'PREMIUM' once the stripe webhook hits.
    }

    // Create user with activation token
    const activationToken = crypto.randomUUID();

    const [newUser] = await db.insert(users).values({
        email,
        password_hash: passwordHash,
        role: role as any,
        credits_balance: initialCredits,
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

    try {
        await sendWelcomeEmail(email, activationUrl);
    } catch (mailError: any) {
        console.error('Failed to send activation email:', mailError);
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Usuário criado com sucesso, mas houve um problema ao enviar o e-mail de ativação. Por favor, verifique se o e-mail inserido está correto ou contate o suporte.',
                warning: 'Email delivery failed',
                details: mailError.message,
                user: { id: newUser.id, email: newUser.email, role: newUser.role, activated: false }
            })
        };
    }

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: 'Usuário criado com sucesso. Por favor, verifique seu e-mail para ativar sua conta.',
            user: { id: newUser.id, email: newUser.email, role: newUser.role, activated: false }
        })
    };

} catch (error: any) {
    console.error('Signup Error:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({
            error: 'Erro ao processar cadastro.',
            details: error.message || error.toString(),
            stack: error.stack
        })
    };
}
};
