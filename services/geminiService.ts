import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse, GameResult } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const analyzePerformance = async (
  currentResult: GameResult,
  history: GameResult[]
): Promise<AIAnalysisResponse> => {
  try {
    const recentTimes = history.slice(-5).map(h => h.timeSeconds).join(", ");
    const averageTime = history.length > 0 
      ? (history.reduce((acc, curr) => acc + curr.timeSeconds, 0) / history.length).toFixed(2)
      : currentResult.timeSeconds;

    const prompt = `
      I just completed a 5x5 Schulte Grid test.
      My Time: ${currentResult.timeSeconds} seconds.
      My Past 5 Times: [${recentTimes}].
      My Average Time: ${averageTime} seconds.
      Mistakes made: ${currentResult.mistakes}.

      Provide a brief, encouraging coaching analysis of my peripheral vision and focus performance.
      Be concise. Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "1-2 sentences analyzing the performance." },
            rating: { type: Type.STRING, enum: ["Excellent", "Good", "Average", "Needs Improvement"] },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2 specific tips to improve speed or focus."
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResponse;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      feedback: "Great job completing the grid! Keep practicing to improve your visual scanning speed.",
      rating: "Good",
      tips: ["Try to look at the center of the grid and see peripheral numbers.", "Relax your eyes to widen your field of view."]
    };
  }
};