import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.NETLIFY_DATABASE_URL && process.env.DATABASE_URL) {
    process.env.NETLIFY_DATABASE_URL = process.env.DATABASE_URL;
}

import { db } from '../src/db';
import { users } from '../src/db/schema';
import { desc } from 'drizzle-orm';
import { sendWelcomeEmail, sendEngagementDay1, sendEngagementDay2, sendEngagementDay3, sendEngagementDay5 } from '../netlify/functions/utils/email';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("Buscando usuário mais recente...");
    const [latestUser] = await db.select().from(users).orderBy(desc(users.created_at)).limit(1);

    if (!latestUser) {
        console.log("Nenhum usuário encontrado no banco de dados.");
        process.exit(1);
    }

    console.log(`Usuário alvo: ${latestUser.email} (Criado em: ${latestUser.created_at})`);
    const name = 'Vendedor(a)';
    const activationUrl = `https://amazon-sem-segredos.netlify.app/activate?token=${latestUser.activation_token || 'demo-token'}`;

    try {
        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] --- Enviando E-mail de Boas Vindas ---`);
        await sendWelcomeEmail(latestUser.email, activationUrl);

        console.log("Aguardando 2 minutos...");
        await delay(120000); // 120 seconds

        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] --- Enviando E-mail Dia 1 ---`);
        await sendEngagementDay1(latestUser.email, name);

        console.log("Aguardando 2 minutos...");
        await delay(120000);

        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] --- Enviando E-mail Dia 2 (Mentor) ---`);
        await sendEngagementDay2(latestUser.email, name);

        console.log("Aguardando 2 minutos...");
        await delay(120000);

        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] --- Enviando E-mail Dia 3 (PRO) ---`);
        await sendEngagementDay3(latestUser.email, name);

        console.log("Aguardando 2 minutos...");
        await delay(120000);

        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] --- Enviando E-mail Dia 5 (Starter) ---`);
        await sendEngagementDay5(latestUser.email, name);

        console.log(`\\n[${new Date().toLocaleTimeString('pt-BR')}] ✅ Todos os e-mails foram enviados com sucesso!`);
    } catch (err) {
        console.error("❌ Erro ao enviar os e-mails:", err);
    }
}

main().catch(error => {
    console.error("Erro crítico:", error);
    process.exit(1);
});
