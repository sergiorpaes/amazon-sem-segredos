
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { token } = event.queryStringParameters || {};

    if (!token) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Token de ativação ausente' }) };
    }

    try {
        // Find user with this token
        const existingUsers = await db.select().from(users).where(eq(users.activation_token, token)).limit(1);

        if (existingUsers.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Token de ativação inválido ou expirado' }) };
        }

        const user = existingUsers[0];

        if (user.activated_at) {
            return {
                statusCode: 200,
                body: `
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                        <h1 style="color: #059669;">Conta já Ativada!</h1>
                        <p>Sua conta já foi ativada anteriormente. Você já pode fazer login.</p>
                        <a href="/" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; rounded: 5px;">Ir para Login</a>
                    </body>
                </html>
                `,
                headers: { 'Content-Type': 'text/html' }
            };
        }

        // Activate user
        await db.update(users)
            .set({
                activated_at: new Date(),
                activation_token: null // Clear token after use
            })
            .where(eq(users.id, user.id));

        return {
            statusCode: 200,
            body: `
            <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: #059669;">Conta Ativada com Sucesso!</h1>
                    <p>Sua conta foi ativada. Agora você pode acessar a plataforma e utilizar seus créditos.</p>
                    <a href="/" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; rounded: 5px;">Acessar Plataforma</a>
                </body>
            </html>
            `,
            headers: { 'Content-Type': 'text/html' }
        };

    } catch (error: any) {
        console.error('Activation Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao ativar conta' }) };
    }
};
