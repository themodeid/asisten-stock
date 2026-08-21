import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

let aiClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    if (!ENV.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY is not set. Gemini features will return fallback/mock data.");
    }
    aiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY || "dummy_key" });
  }
  return aiClient;
};
