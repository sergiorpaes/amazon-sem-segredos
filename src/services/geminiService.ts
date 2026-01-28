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

// Maps ChatMessage type to Gemini content part
const mapToGeminiHistory = (history: any[]) => {
  // Find the index of the first user message
  const firstUserIndex = history.findIndex(msg => msg.role === 'user');

  // If no user message found (e.g. only system welcome), return empty history
  if (firstUserIndex === -1) return [];

  // Slice from the first user message
  const validHistory = history.slice(firstUserIndex);

  return validHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
};

export const chatWithMentor = async (message: string, history: any[], instructions?: string) => {
  try {
    const geminiHistory = mapToGeminiHistory(history);

    const response = await fetch('/.netlify/functions/gemini-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: geminiHistory,
        instructions
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If JSON parse fails, throw status text
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    if (!response.ok) {
      // Prefer the detailed message if exists, otherwise the error code, otherwise status text
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status} - ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data.response;

  } catch (error: any) {
    console.error("Gemini AI Connection Error:", error);
    // Return the actual error message if possible to help debugging, or a friendly one
    return `Erro de Conexão: ${error.message || "Tente novamente."}`;
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