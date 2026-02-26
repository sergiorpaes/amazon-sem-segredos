import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateDescriptions() {
    console.log("Buscando fornecedores para atualizar com IA...");
    try {
        // We only want to process suppliers with generic descriptions or empty
        const suppliers = await sql`SELECT id, name, url, categories, description FROM amz_suppliers`;

        let suppliersToUpdate = suppliers.filter(s =>
            !s.description ||
            s.description.includes('online de destaque') ||
            s.description.includes('renomado (B2B)') ||
            s.description.includes('estratégico de produtos')
        );

        console.log(`Total: ${suppliers.length}. Encontrados ${suppliersToUpdate.length} fornecedores precisando de descrição personalizada.`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        for (const supplier of suppliersToUpdate) {
            console.log(`\nGerando para: ${supplier.name} (${supplier.url}) e categorias: ${supplier.categories}`);

            try {
                const prompt = `Você é um assistente especialista em Amazon FBA e Sourcing.
Crie uma descrição única e específica, criativa e concisa (limite estrito de 2 a 3 frases curtas) em português do Brasil para o fornecedor chamado "${supplier.name}". 
Site de referência: ${supplier.url}
Categorias cadastradas: ${supplier.categories}

Aja rápido e fale sobre o tipo de produto que eles oferecem de acordo com o nome e as categorias fornecidas. Descreva qual o modelo deles (fábrica, atacadista ou varejista/B2C) e diga por que são úteis para quem vende na Amazon.
ATENÇÃO: Não invente mentiras sobre o site se não souber; deduza pelo nome do parceiro ou sua categoria (Ex: se chama "Tech Wholesale", é óbvio que vendem eletrônicos B2B).
Retorne APENAS a descrição e nada mais. Não use aspas na resposta.`;

                const result = await model.generateContent(prompt);
                const desc = result.response.text().trim();

                if (desc) {
                    await sql`UPDATE amz_suppliers SET description = ${desc} WHERE id = ${supplier.id}`;
                    console.log(`>>> Nova: ${desc}`);
                }

                // Pequeno delay para evitar rate limit block
                await new Promise(r => setTimeout(r, 600));
            } catch (err: any) {
                console.error(`Erro ao gerar para ${supplier.name}:`, err.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        console.log('\nTodas as descrições geradas com IA com sucesso!');
    } catch (e) {
        console.error("Erro geral no script:", e);
    } finally {
        process.exit();
    }
}

generateDescriptions();
