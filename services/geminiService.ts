
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnimeCharacter, AnimeStyle, AspectRatio, DetailLevel } from "../types";

/**
 * Always use process.env.API_KEY directly when initializing GoogleGenAI.
 */
export const createAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Enhanced error handling for user-friendly feedback.
 */
export const handleAIError = async (error: any): Promise<string | null> => {
  const errorMessage = typeof error === 'string' ? error : (error?.message || error?.toString() || "");
  console.error("Gemini API Error Detail:", error);

  if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403") || errorMessage.includes("API_KEY_INVALID")) {
    return "Neural Authorization Failed. The bridge to the AI core is restricted. Please verify your system configuration.";
  }

  if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
    return "Neural Congestion. The matrix is overloaded. Please wait 60 seconds before retrying.";
  }

  if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
    return "The model declined to manifest this vision due to safety protocols. Please adjust your prompt.";
  }

  if (errorMessage.includes("Network error") || errorMessage.includes("fetch failed") || errorMessage.includes("NetworkError")) {
    return "Connectivity Interrupted. The neural bridge lost sync with the server. Check your network link.";
  }
  
  return null;
};

// Generic AI query for text generation tasks like Quiz questions
// Fixes the missing export error in QuizMaster.tsx
export const queryAssistant = async (prompt: string, history: any[] = []) => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response;
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Assistant query failed.");
  }
};

// Character Forge: Using gemini-3-pro-preview
export const forgeCharacter = async (prompt: string): Promise<AnimeCharacter> => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Create a detailed anime character based on this theme: ${prompt}. Design for the 2026 era.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            personality: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                charisma: { type: Type.INTEGER },
              },
              required: ["strength", "agility", "intelligence", "charisma"],
            },
            backstory: { type: Type.STRING },
            specialMove: { type: Type.STRING },
          },
          required: ["id", "name", "title", "personality", "stats", "backstory", "specialMove"],
        },
      },
    });

    const char = JSON.parse(response.text || '{}');
    if (!char.id) char.id = crypto.randomUUID();
    return char;
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Neural forge failed.");
  }
};

// Scene Imaginer / Anime Artist
export const imagineScene = async (
  prompt: string, 
  style: AnimeStyle = 'Shonen', 
  aspectRatio: AspectRatio = '16:9',
  detailLevel: DetailLevel = 'High',
  base64Image?: string
): Promise<string> => {
  const isUltra = detailLevel === 'Ultra';
  const model = isUltra ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const ai = createAIInstance();
  
  const qualityPrompt = isUltra ? "masterpiece, ultra-detailed, 8k resolution," : "high detail, professional digital art,";
  const parts: any[] = [];
  
  if (base64Image) {
    const data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    parts.push({ inlineData: { data, mimeType: 'image/png' } });
    parts.push({ text: `Modify this scene: ${prompt}. Style: ${style}. ${qualityPrompt}` });
  } else {
    parts.push({ text: `Generate anime illustration: ${prompt}. Style: ${style}. ${qualityPrompt}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: aspectRatio, ...(isUltra ? { imageSize: "2K" } : {}) }
      },
    });

    let imageUrl = '';
    let refusalText = '';
    
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          refusalText = part.text;
        }
      }
    }
    
    if (!imageUrl) {
      throw new Error(refusalText ? `Neural Refusal: ${refusalText}` : "Neural static. No visual data returned.");
    }
    return imageUrl;
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || error.message || "Manifestation failure.");
  }
};

// Live Search: Uses Google Search grounding.
export const searchInternet = async (query: string) => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide detailed report on: ${query}.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        web: { title: chunk.web?.title || 'Source', uri: chunk.web?.uri }
      })).filter((s: any) => s.web.uri).map((s: any) => s.web) || []
    };
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Neural search bridge failed.");
  }
};

// Search Suggestions
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 concise anime/tech search suggestions for: "${query}". Format as comma-separated list.`,
    });
    return (response.text || "").split(',').map(s => s.trim()).filter(s => s !== "");
  } catch (error: any) {
    return [`${query} release date`, `${query} news`, `${query} season 2`];
  }
};

// Scene Suggestions
export const getSceneSuggestions = async (): Promise<string[]> => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 creative anime scene prompts for 2026. Comma-separated list.`,
    });
    return (response.text || "").split(',').map(s => s.trim()).filter(s => s !== "");
  } catch (error: any) {
    return ["Cyberpunk Tokyo 2026", "A floating sky fortress", "Mecha battle in orbit"];
  }
};

// TTS
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Neural speech synthesis failed.");
    return base64Audio;
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Speech link failed.");
  }
};

export const generateVoicePreview = async (voiceName: string): Promise<string> => {
  return generateSpeech(`Resonance check for voice matrix ${voiceName}.`, voiceName);
};

// Nexus Category Intel
export const fetchUpcomingNexus = async (category: string) => {
  const ai = createAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Report for category: ${category}. Focus on 2025/2026 milestones.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        web: { title: chunk.web?.title || 'Source', uri: chunk.web?.uri }
      })).filter((s: any) => s.web.uri).map((s: any) => s.web) || []
    };
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Nexus bridge failed.");
  }
};

// Encoding/Decoding Helpers
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
