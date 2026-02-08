
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Email é obrigatório' }) };
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
            // Secretly fail or return success to avoid email enumeration? 
            // For this app, a message saying "se o email existir..." is better.
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Se este e-mail estiver cadastrado, você receberá um link de recuperação em instantes.' })
            };
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        await db.update(users)
            .set({
                reset_password_token: token,
                reset_password_expires: expires
            })
            .where(eq(users.id, user.id));

        const host = event.headers.host || 'localhost:8888';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"Amazon Sem Segredos" <sergiorobertopaes@gmail.com>',
            to: email,
            subject: '🔒 Recuperação de Senha - Amazon Sem Segredos AI',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Recuperação de Senha</h2>
                    <p>Olá,</p>
                    <p>Você solicitou a redefinição de sua senha no Amazon Sem Segredos AI.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            REDEFINIR MINHA SENHA
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px;">Se você não solicitou isso, por favor ignore este e-mail.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 Amazon Sem Segredos AI</p>
                </div>
            `
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'E-mail de recuperação enviado com sucesso!' })
        };

    } catch (error: any) {
        console.error('Forgot Password Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao processar solicitação' }) };
    }
};
