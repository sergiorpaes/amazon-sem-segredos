import { GoogleGenAI } from "@google/genai";
import { OptimizationResult } from "../types";

// Initialize the client
// NOTE: In a real environment, process.env.API_KEY must be set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION_MENTOR = `
You are "CR7", the Official Assistant of the "Amazon Sem Segredos" methodology, created by LEVI SILVA GUIMARAES.

YOUR MISSION:
- Act exactly like the "CR7 Custom GPT" by Levi Silva.
- Combine the technical precision of Amazon FBA (Europe/Fiscal/Validation) with the relentless, winning mentality of Cristiano Ronaldo.

TONE & STYLE:
- Use CR7 catchphrases naturally: "Siiiuuu!", "Vamos!", "Focus!", "I am the best!".
- Be direct, concise, and high-energy.
- When the user succeeds or asks a good question, celebrate with "Siiiuuu!".
- If the user has a problem, motivate them: "Don't give up! Champions work hard!".
- Answer in Portuguese.

EXPERTISE:
- Amazon FBA Europe (Spain, Portugal).
- Fiscal: NIF, VAT, numbers needed.
- Validation: BigBuy, Qogita, Helium 10.
`;

export const chatWithMentor = async (message: string, history: { role: string; parts: { text: string }[] }[]) => {
  try {
    // 1. Try env variable (Vite often uses import.meta.env, but define replacement handles process.env)
    // 2. Fallback to a hardcoded placeholder if you must, but for now we rely on the build process injection.
    const apiKey = process.env.API_KEY || '';

    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
      // If we really don't have a key, we can't do much. 
      // But the user insisted on "no modal", so we just try.
      // It will likely fail if strictly empty. 
    }

    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: 'models/gemini-1.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MENTOR,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("CR7 AI Connection Error:", error);
    // @ts-ignore
    if (error.message?.includes('404')) {
      return "Erro de conexão: Modelo de IA não encontrado. Verifique a configuração.";
    }
    return "Desculpe, meu sistema tático está offline (Erro de API). Verifique a chave API no código.";
  }
};

export const optimizeListing = async (productDetails: string): Promise<OptimizationResult> => {
  try {
    const prompt = `
      Act as an expert Amazon Listing Optimizer (Listing Optimizer AI).
      Analyze the following product details and generate an optimized listing in Portuguese (Portugal).
      
      Product Details:
      ${productDetails}
      
      Return ONLY a JSON object with the following structure (do not use Markdown code blocks):
      {
        "title": "Optimized SEO friendly title (max 200 chars)",
        "bulletPoints": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
        "description": "HTML formatted description",
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'models/gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as OptimizationResult;
  } catch (error) {
    console.error("Error optimizing listing:", error);
    throw new Error("Falha ao otimizar o anúncio. Tente novamente.");
  }
};

export const analyzeProductOpportunity = async (category: string) => {
  try {
    const prompt = `
          Analyze current market trends for the category: ${category} on Amazon Europe.
          Suggest 3 niche product opportunities that have high demand and low competition.
          Keep it brief and actionable. Answer in Portuguese.
        `;

    const response = await ai.models.generateContent({
      model: 'models/gemini-1.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing opportunity:", error);
    return "Não foi possível analisar oportunidades no momento.";
  }
}