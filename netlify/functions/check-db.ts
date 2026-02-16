
import { db } from '../../src/db';
import { sql } from 'drizzle-orm';

export const handler = async (event: any) => {
    try {
        // Query information_schema to check table existence
        const tableCheck = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'amz_listings';
        `);

        // Query columns if table exists
        let columnsCheck: any[] = [];
        if (tableCheck.rows.length > 0) {
            const columnsResult = await db.execute(sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'amz_listings';
            `);
            columnsCheck = columnsResult.rows;
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                exists: tableCheck.rows.length > 0,
                columns: columnsCheck,
                tableInfo: tableCheck.rows
            })
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message, stack: error.stack })
        };
    }
};
