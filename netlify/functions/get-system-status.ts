import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

export const handler: Handler = async (event) => {
    try {
        if (!process.env.NETLIFY_DATABASE_URL) throw new Error('DB_URL missing');
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        const result = await sql`
            SELECT key, value FROM amz_system_config
        `;

        const configs: Record<string, any> = {};
        result.forEach(row => {
            // Primitive conversion
            if (row.value === 'true') configs[row.key] = true;
            else if (row.value === 'false') configs[row.key] = false;
            else if (!isNaN(Number(row.value)) && row.key === 'initial_credits') configs[row.key] = Number(row.value);
            else configs[row.key] = row.value;
        });

        // Ensure defaults for critical keys if not in DB
        const response = {
            isMaintenance: configs.maintenance_mode ?? false,
            stripeMode: configs.stripe_mode ?? 'TEST',
            registrationEnabled: configs.registration_enabled ?? true,
            aiModel: configs.ai_model ?? 'gemini-1.5-flash',
            debugMode: configs.debug_mode ?? false,
            initialCredits: configs.initial_credits ?? 5,
            ...configs // Include any other keys
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        };
    } catch (error: any) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                isMaintenance: false,
                stripeMode: 'TEST',
                registrationEnabled: true,
                aiModel: 'gemini-1.5-flash',
                debugMode: false,
                initialCredits: 5,
                error: error.message
            })
        };
    }
};
