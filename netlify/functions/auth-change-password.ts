
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
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) };
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { currentPassword, newPassword } = JSON.parse(event.body);

        if (!currentPassword || !newPassword) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Senha atual e nova senha são obrigatórias' }) };
        }

        const [user]: any = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

        if (!user) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Usuário não encontrado' }) };
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Senha atual incorreta' }) };
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await db.update(users)
            .set({ password_hash: newPasswordHash })
            .where(eq(users.id, user.id));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Senha alterada com sucesso' })
        };

    } catch (error: any) {
        console.error('Change Password Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao processar solicitação' }) };
    }
};
