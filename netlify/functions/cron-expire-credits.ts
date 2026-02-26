import { schedule } from '@netlify/functions';
import { db } from '../../src/db';
import { users, creditsLedger } from '../../src/db/schema';
import { lt, and, gt, eq } from 'drizzle-orm';

// Esta função roda todos os dias à meia-noite (UTC)
const expireCreditsHandler = async (event: any) => {
    console.log("Iniciando rotina de expiração de créditos mensais...");

    try {
        const now = new Date();

        // Buscamos todas as entradas no ledger que:
        // 1. São do tipo 'monthly' (ou que tenham expires_at)
        // 2. Não foram totalmente gastas (remaining_amount > 0)
        // 3. Já passaram da data de expiração (expires_at < now)
        const expiredEntries = await db
            .select()
            .from(creditsLedger)
            .where(
                and(
                    gt(creditsLedger.remaining_amount, 0),
                    lt(creditsLedger.expires_at, now)
                )
            );

        if (expiredEntries.length === 0) {
            console.log("Nenhum crédito expirado encontrado hoje.");
            return { statusCode: 200, body: 'None expired' };
        }

        console.log(`Encontrados ${expiredEntries.length} pacotes expirados para processar.`);

        let totalExpired = 0;

        // Agrupar expirados por usuário para otimizar as queries de UPDATE de saldo
        const expiredByUser: Record<number, number> = {};

        for (const entry of expiredEntries) {
            const amountToExpire = entry.remaining_amount;
            totalExpired += amountToExpire;

            // Somar por usuário
            if (!expiredByUser[entry.user_id]) {
                expiredByUser[entry.user_id] = 0;
            }
            expiredByUser[entry.user_id] += amountToExpire;

            // 1. Zerar o saldo na ledger entry
            await db.update(creditsLedger)
                .set({ remaining_amount: 0 })
                .where(eq(creditsLedger.id, entry.id));
        }

        // 2. Deduzir o valor expirado do saldo total (credits_balance) de cada usuário
        for (const [userIdStr, totalAmount] of Object.entries(expiredByUser)) {
            const userId = parseInt(userIdStr);
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

            if (user) {
                // Prevenir que o saldo fique negativo (caso haja alguma dessincronização bizarra)
                const newBalance = Math.max(0, user.credits_balance - totalAmount);

                await db.update(users)
                    .set({ credits_balance: newBalance })
                    .where(eq(users.id, userId));

                console.log(`Usuário ${user.email} teve ${totalAmount} créditos exprirados zerados. Novo saldo: ${newBalance}`);
            }
        }

        console.log(`Rotina concluída com sucesso. Total de ${totalExpired} créditos invalidados.`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Expirou ${totalExpired} créditos de ${Object.keys(expiredByUser).length} usuários.`
            })
        };

    } catch (error) {
        console.error("Erro ao rodar cron job de expiração:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to expire credits" })
        };
    }
};

// Exportar a função encapsulada no método de agendamento diário (@daily = todo dia a meia-noite)
export const handler = schedule("@daily", expireCreditsHandler);
