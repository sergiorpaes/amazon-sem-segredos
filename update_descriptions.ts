import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function updateDescriptions() {
    console.log("Buscando fornecedores sem descrição...");
    try {
        // Fetch suppliers without description or with empty string
        const suppliers = await sql`SELECT id, name, categories FROM amz_suppliers WHERE description IS NULL OR description = ''`;
        console.log(`Encontrados ${suppliers.length} fornecedores precisando de descrição.`);

        for (const supplier of suppliers) {
            let desc = "";
            let catStr = "";

            // Neon returns JSONB as an object or array if it was inserted properly, but sometimes as string.
            let catArray: string[] = [];
            try {
                if (typeof supplier.categories === 'string') {
                    catArray = JSON.parse(supplier.categories);
                } else if (Array.isArray(supplier.categories)) {
                    catArray = supplier.categories;
                }
            } catch (e) { }

            const isWholesale = catArray.find(c => c.toLowerCase().includes('wholesale') || c.toLowerCase().includes('b2b'));
            const isRetailer = catArray.find(c => c.toLowerCase().includes('retailer') || c.toLowerCase().includes('b2c'));

            if (isWholesale) {
                desc = `Atacadista renomado (B2B) focado em distribuição de produtos para revenda. Ótimo parceiro para abastecer seu inventário FBA.`;
            } else if (isRetailer) {
                desc = `Varejista online de destaque (B2C) com um catálogo vasto de produtos diários. Ideal para sourcing ágil.`;
            } else {
                desc = `Fornecedor estratégico de produtos com alto potencial para venda na Amazon Europa.`;
            }

            await sql`UPDATE amz_suppliers SET description = ${desc} WHERE id = ${supplier.id}`;
        }

        console.log('Descrições atualizadas com sucesso!');
    } catch (e) {
        console.error("Erro:", e);
    } finally {
        process.exit();
    }
}
updateDescriptions();
