
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.NETLIFY_DATABASE_URL;
if (!databaseUrl) {
    throw new Error('NETLIFY_DATABASE_URL is not defined in .env.local');
}

const sql = neon(databaseUrl);

async function migrate() {
    console.log('🚀 Iniciando migração para recuperação de senha...');

    try {
        // Add reset password columns
        await sql`ALTER TABLE amz_users ADD COLUMN IF NOT EXISTS reset_password_token TEXT;`;
        await sql`ALTER TABLE amz_users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;`;

        console.log('✅ Colunas de reset_password adicionadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    }
}

migrate();
