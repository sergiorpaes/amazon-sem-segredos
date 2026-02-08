
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if exists
if (fs.existsSync(path.resolve('.env.local'))) {
    dotenv.config({ path: '.env.local' });
}

async function setupAdmin() {
    const adminEmail = 'sergiorobertopaes@gmail.com';
    const adminPassword = 'adminPassword123!'; // User can change this later

    console.log(`🚀 Setting up Admin user: ${adminEmail}`);

    try {
        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (existing.length > 0) {
            console.log("User exists. Promoting to ADMIN...");
            await db.update(users)
                .set({ role: 'ADMIN' })
                .where(eq(users.email, adminEmail));
            console.log("✅ User promoted to ADMIN!");
        } else {
            console.log("User does not exist. Creating new ADMIN user...");
            const hash = await bcrypt.hash(adminPassword, 10);
            await db.insert(users).values({
                email: adminEmail,
                password_hash: hash,
                role: 'ADMIN',
                credits_balance: 99999, // Super user credits
                phone: '000000000',
                address_street: 'Admin HQ',
                address_city: 'Admin City',
                address_zip: '0000',
                company_name: 'Super Admin'
            });
            console.log(`✅ New ADMIN user created!`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Senha temporária: ${adminPassword}`);
        }
    } catch (error) {
        console.error("❌ Failed to setup admin:", error);
    } finally {
        process.exit(0);
    }
}

setupAdmin();
