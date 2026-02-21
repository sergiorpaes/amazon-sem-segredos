import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { systemConfig } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { sendAdminTicketEmail } from './utils/email';

export const handler: Handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { subject, message, userEmail, userName } = body;

        if (!subject || !message || !userEmail || !userName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Todos os campos são obrigatórios: subject, message, userEmail, userName.' })
            };
        }

        // Fetch support email from config db
        const configResult = await db.select().from(systemConfig).where(eq(systemConfig.key, 'support_email')).limit(1);
        let adminEmail = 'sergiorobertopaes@gmail.com'; // Default fallback

        if (configResult.length > 0 && configResult[0].value) {
            try {
                // value might be stringified implicitly, but let's carefully extract it
                let emailValue = configResult[0].value;
                if (emailValue.startsWith('"') && emailValue.endsWith('"')) {
                    emailValue = JSON.parse(emailValue);
                }
                if (emailValue && emailValue.includes('@')) {
                    adminEmail = emailValue;
                }
            } catch (e) {
                // fallback to DB raw value
                adminEmail = configResult[0].value;
            }
        }

        // Send Email
        await sendAdminTicketEmail(adminEmail, userEmail, userName, subject, message);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Ticket enviado com sucesso!' })
        };

    } catch (error: any) {
        console.error('API Error support-ticket:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno no servidor', details: error.message })
        };
    }
};
