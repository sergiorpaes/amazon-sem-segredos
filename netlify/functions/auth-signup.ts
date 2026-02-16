import { db } from '../../src/db';
import { users, plans, userSubscriptions, systemConfig } from '../../src/db/schema';
import { eq, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import crypto from 'node:crypto';
import { sendWelcomeEmail } from './utils/email';
import { addCredits } from '../../src/lib/credits';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);

        const {
            email,
            password,
            phone,
            company_name,
            address_street,
            address_city,
            address_state,
            address_zip,
            selectedPlan,
            planId
        } = body;

        if (!email || !password || !phone || !address_street) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Faltam campos obrigatórios (Email, Password, Telefone, Morada)' }) };
        }

        // 0. Check Global Settings
        const allConfigs = await db.select().from(systemConfig);
        const configMap: Record<string, string> = {};
        allConfigs.forEach(c => configMap[c.key] = c.value);

        if (configMap.registration_enabled === 'false') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'As inscrições estão temporariamente desativadas. Por favor, tente novamente em breve.' })
            };
        }

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
            return { statusCode: 409, body: JSON.stringify({ error: 'Usuário já existe' }) };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Fetch selected plan
        let plan;
        if (planId) {
            [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
        } else if (selectedPlan) {
            [plan] = await db.select().from(plans).where(ilike(plans.name, selectedPlan)).limit(1);
        }

        if (!plan) {
            // Fallback to default if not found or invalid
            console.warn(`Plan ${selectedPlan} not found, defaulting to Free/Starter logic`);
        }

        // Determine initial credits and role based on plan
        let initialCredits = parseInt(configMap.initial_credits || '5');
        let role = 'USER';

        if (plan) {
            if (plan.monthly_price_eur > 0) {
                initialCredits = 0; // Credits will be added after successful payment/webhook
            } else {
                initialCredits = plan.credit_limit;
            }
        } else {
            // Fallback legacy logic
            if (selectedPlan === 'pro' || selectedPlan === 'premium') {
                initialCredits = 0;
            }
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

        // 🔗 Create User Subscription record
        if (plan) {
            await db.insert(userSubscriptions).values({
                user_id: newUser.id,
                plan_id: plan.id,
                status: 'active',
            });
        }

        // 💰 Initialize Credit Ledger if has initial credits
        if (initialCredits > 0) {
            await addCredits(newUser.id, initialCredits, 'monthly', `Créditos Iniciais Plano ${plan?.name || 'Free'}`);
        }

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
