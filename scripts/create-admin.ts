
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Error: NETLIFY_DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

const SOURCE_EMAIL = 'sergiorobertopaes@gmail.com';
const TARGET_EMAIL = 'amazonsemsegredos@gmail.com';
const TARGET_PASSWORD = 'adminPassword123!';

async function run() {
    console.log(`Connecting to database...`);

    try {
        // 1. Fetch Source User
        const sourceUser = await sql`
            SELECT * FROM amz_users WHERE email = ${SOURCE_EMAIL}
        `;

        if (sourceUser.length === 0) {
            console.error(`Source user ${SOURCE_EMAIL} not found!`);
            process.exit(1);
        }

        const source = sourceUser[0];
        console.log(`Found source user: ${source.email} (ID: ${source.id})`);

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TARGET_PASSWORD, salt);

        // 3. Create New Admin User (Clone)
        // We'll generate a new ID and set role to ADMIN
        // We copy other preferences/fields from source

        // Check if target exists first
        const existingTarget = await sql`SELECT * FROM amz_users WHERE email = ${TARGET_EMAIL}`;
        if (existingTarget.length > 0) {
            console.log(`User ${TARGET_EMAIL} already exists. Updating password and role...`);
            await sql`
                UPDATE amz_users 
                SET password_hash = ${hashedPassword}, role = 'ADMIN'
                WHERE email = ${TARGET_EMAIL}
            `;
            console.log('Updated successfully.');
        } else {
            console.log(`Creating new user ${TARGET_EMAIL}...`);
            await sql`
                INSERT INTO amz_users (
                    full_name, email, password_hash, role, 
                    phone, credits_balance, 
                    activated_at, activation_token
                ) VALUES (
                    ${source.full_name || 'Admin User'}, 
                    ${TARGET_EMAIL}, 
                    ${hashedPassword}, 
                    'ADMIN',
                    ${source.phone}, 
                    ${source.credits_balance || 5}, 
                    NOW(), 
                    null
                )
            `;
            console.log('Created successfully.');
        }

    } catch (err) {
        console.error('Error executing script:', err);
    }
}

run();
