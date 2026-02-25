import { Handler } from "@netlify/functions";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { consumeCredits, isAlreadyConsumed } from '../../src/lib/credits';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event, context) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const {
            asin,
            marketplaceId,
            productTitle,
            productBrand,
            productCategory,
            productPrice,
            productBsr,
            productSales,
            productReviews,
            productActiveSellers,
            productCurrency,
            language = 'pt',
        } = body;

        if (!asin) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing ASIN" }) };
        }

        // 1. Auth & Credits
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;
        if (!token) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        let userId: number;
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            userId = decoded.userId;
        } catch (e) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid token" }) };
        }

        // Deduct 5 credits for competition analysis
        try {
            const alreadyConsumed = await isAlreadyConsumed(userId, 'ANALYZE_COMPETITION', asin);

            if (alreadyConsumed) {
                console.log(`[AI Analysis] Duplicate analysis detected for UserID: ${userId}, ASIN: ${asin}. Skipping deduction.`);
            } else {
                await consumeCredits(userId, 1, 'ANALYZE_COMPETITION', { asin });
                console.log(`[AI Analysis] Credits consumed for UserID: ${userId}`);
            }
        } catch (e: any) {
            return {
                statusCode: 402,
                headers,
                body: JSON.stringify({ error: e.message || 'Insufficient credits', code: 'NO_CREDITS' })
            };
        }

        // 2. Try to fetch Reviews (Scraping - best effort, may be blocked by Amazon)
        const domain = (() => {
            const domainMap: Record<string, string> = {
                'A1RKKUPIHCS9HS': 'amazon.es',
                'A1PA6795UKMFR9': 'amazon.de',
                'A13V1IB3VIYZZH': 'amazon.fr',
                'APJ6JRA9NG5V4': 'amazon.it',
                'A1F83G8C2ARO7P': 'amazon.co.uk',
                'A2Q3Y263D00KWC': 'amazon.com.br',
            };
            return domainMap[marketplaceId] || 'amazon.com';
        })();

        const reviewsUrl = `https://www.${domain}/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?sortBy=recent`;
        console.log(`[AI Analysis] Attempting to scrape reviews from: ${reviewsUrl}`);

        const reviews: string[] = [];
        try {
            const response = await fetch(reviewsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Referer': `https://www.${domain}/dp/${asin}`
                }
            });

            const html = await response.text();
            const isBlocked = html.includes('captcha') || html.includes('Robot Check') || html.includes('api-services-support@amazon.com');

            if (!isBlocked) {
                const selectors = [
                    /<span data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/g,
                    /class="a-size-base review-text review-text-content"[^>]*>([\s\S]*?)<\/span>/g,
                ];
                for (const selector of selectors) {
                    let match;
                    while ((match = selector.exec(html)) !== null && reviews.length < 10) {
                        const cleanText = match[1].replace(/<[^>]*>?/gm, '').trim();
                        if (cleanText && cleanText.length > 20 && !reviews.includes(cleanText)) {
                            reviews.push(cleanText);
                        }
                    }
                    if (reviews.length > 0) break;
                }
            }
            console.log(`[AI Analysis] Extracted ${reviews.length} reviews. Blocked: ${isBlocked}`);
        } catch (scrapeError) {
            console.warn('[AI Analysis] Review scraping failed, proceeding with product data only.', scrapeError);
        }

        // 3. Build a rich, product-specific AI prompt
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const currency = productCurrency || 'EUR';
        const productContext = `
PRODUTO ANALISADO:
- ASIN: ${asin}
- Título: ${productTitle || 'Desconhecido'}
- Marca: ${productBrand || 'Sem marca'}
- Categoria: ${productCategory || 'Geral'}
- Preço: ${productPrice ? `${productPrice} ${currency}` : 'Desconhecido'}
- BSR (Ranking de Vendas): ${productBsr ? `#${productBsr.toLocaleString()}` : 'Desconhecido'}
- Vendas Estimadas/mês: ${productSales ? `${productSales} unidades` : 'Desconhecido'}
- Avaliações: ${productReviews ? `${productReviews} reviews` : 'Desconhecido (NÃO ASSUMA ZERO)'}
- Vendedores Ativos: ${productActiveSellers || 'Desconhecido'}
- Marketplace: ${domain}
`.trim();

        const reviewContext = reviews.length > 0
            ? `\nREVIEWS REAIS DOS CLIENTES (${reviews.length} extraídas):\n${reviews.map((r, i) => `${i + 1}. "${r}"`).join('\n')}`
            : `\nNota: Não foi possível extrair a nota ou o número exato de reviews em tempo real devido a limitações técnicas. Baseie a análise nos outros dados técnicos.`;

        const prompt = `Você é um especialista em marketplace Amazon com profundo conhecimento em análise competitiva, copy de listings e psicologia do comprador online.

${productContext}
${reviewContext}

SUA TAREFA: Faz uma análise competitiva ESPECÍFICA e ACIONÁVEL para este produto exato. As respostas devem ser 100% personalizadas para este produto, sua categoria, faixa de preço e concorrência. NUNCA dê respostas genéricas.

INSTRUCÇÕES CRÍTICAS:
1. SE o número de avaliações for "Desconhecido", PROIBIDO usar "falta de reviews", "ausência de avaliações", "baixa prova social" ou sinônimos como fraqueza. O produto pode ter dezenas de milhares de reviews. Ignore as reviews na análise e foque no produto físico, categoria e preço.
${reviews.length > 0
                ? `2. Analise as reviews reais para identificar padrões de insatisfação recorrentes específicos deste produto/categoria.
3. Identifique os 3 pontos fracos mais mencionados pelos compradores.
4. Baseie as oportunidades de melhoria diretamente nos problemas identificados.`
                : `2. Com base no preço (${productPrice ? `${productPrice} ${currency}` : 'N/A'}), BSR #${productBsr || 'N/A'} e categoria "${productCategory || 'Geral'}", infira os pontos fracos típicos desta faixa de mercado/produto físico.
3. Considera o perfil do comprador que compra nesta categoria e neste preço.
4. Gera oportunidades de melhoria estratégicas e específicas para superar concorrentes com este tipo de produto, ignorando a ausência de quantidade de reviews.`}

FORMATO DE RESPOSTA (JSON):
{
  "weaknesses": [
    "Fraqueza específica 1",
    "Fraqueza específica 2",
    "Fraqueza específica 3"
  ],
  "improvements": [
    "Oportunidade concreta 1",
    "Oportunidade concreta 2",
    "Oportunidade concreta 3"
  ],
  "summary": "Resumo de 2 linhas sobre o posicionamento competitivo."
}

Idioma da resposta: ${language === 'pt' ? 'Português do Brasil' : language === 'es' ? 'Espanhol' : 'Inglês'}. Seja específico, direto e acionável.`;

        const result = await model.generateContent(prompt);
        const aiText = result.response.text();

        // Extract JSON from AI response (handle potential markdown fences)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { error: "Failed to parse AI response", raw: aiText };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...analysis,
                rawReviews: reviews.slice(0, 5),
                usedRealReviews: reviews.length > 0,
            })
        };

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
