
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: API_KEY });


export async function getOracleAdvice(resources: any): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o Oráculo do Templo no jogo "Reino dos Fragmentos". O jogador tem ${resources.coins} moedas, ${resources.food} comida e ${resources.materials} materiais. Dê um conselho curto (máximo 100 caracteres) em português sobre o que ele deve focar agora de forma mística.`,
    });
    return response.text || "Os deuses estão em silêncio hoje.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha a fé e seus fragmentos brilharão.";
  }
}

export async function getVictoryLore(): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Escreva uma frase curta e épica de vitória para um jogo de fantasia em português (máximo 15 palavras).",
    });
    return response.text || "Vitória gloriosa!";
  } catch (error) {
    return "Os inimigos recuam diante de seu poder!";
  }
}
