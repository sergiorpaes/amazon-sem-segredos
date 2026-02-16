import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

export const handler: Handler = async (event) => {
    try {
        if (!process.env.NETLIFY_DATABASE_URL) throw new Error('DB_URL missing');
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        const result = await sql`
            SELECT value FROM amz_system_config WHERE key = 'maintenance_mode'
        `;

        const isMaintenance = result.length > 0 ? result[0].value === 'true' : false;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isMaintenance })
        };
    } catch (error: any) {
        return {
            statusCode: 200, // Return 200 even on error to avoid breaking frontend app load, assume no maintenance
            body: JSON.stringify({ isMaintenance: false, error: error.message })
        };
    }
};
