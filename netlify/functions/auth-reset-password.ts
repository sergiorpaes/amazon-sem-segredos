
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { token, newPassword } = JSON.parse(event.body);

        if (!token || !newPassword) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Token e nova senha são obrigatórios' }) };
        }

        // Find user with valid token and not expired
        const [user] = await db.select()
            .from(users)
            .where(
                and(
                    eq(users.reset_password_token, token),
                    gt(users.reset_password_expires, new Date())
                )
            )
            .limit(1);

        if (!user) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Token inválido ou expirado' }) };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear token
        await db.update(users)
            .set({
                password_hash: passwordHash,
                reset_password_token: null,
                reset_password_expires: null
            })
            .where(eq(users.id, user.id));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' })
        };

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao redefinir senha' }) };
    }
};
