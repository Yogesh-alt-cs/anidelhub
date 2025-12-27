
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnimeCharacter, AnimeStyle, AspectRatio, DetailLevel } from "../types";

/**
 * Helper to ensure a high-quality model has an appropriate API key context.
 * For gemini-3-pro-image-preview, users MUST select their own API key.
 */
export const ensureProModelKey = async () => {
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Proceeding after trigger to mitigate race conditions as per instructions
    }
  }
};

/**
 * Always creates a fresh instance of GoogleGenAI to ensure we use 
 * the most up-to-date API key (especially after a user selects one in the dialog).
 */
export const createAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Enhanced error handling for user-friendly feedback and environment synchronization.
 */
export const handleAIError = async (error: any): Promise<string | null> => {
  let errorMessage = "";
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || JSON.stringify(error);
  } else {
    errorMessage = String(error);
  }

  console.error("Gemini API Error Detail:", error);

  // Specific check for "Requested entity was not found" which indicates a key issue
  if (errorMessage.includes("Requested entity was not found.")) {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      return "Neural Link Reset: Your API key project was not found or is invalid. Please select a valid key from a paid GCP project.";
    }
  }

  // Network or Fetch Errors
  if (
    errorMessage.includes("Network error") || 
    errorMessage.includes("fetch failed") || 
    errorMessage.includes("NetworkError") || 
    errorMessage.includes("Failed to fetch") || 
    errorMessage.includes("Load failed") ||
    !window.navigator.onLine
  ) {
    return "Neural Sync Lost: A network error occurred. Please check your internet link or neural bridge (ad-blockers can sometimes interfere).";
  }

  // Permission / Auth Errors
  if (
    errorMessage.includes("PERMISSION_DENIED") || 
    errorMessage.includes("403") || 
    errorMessage.includes("API key not found")
  ) {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      return "Authorization Required: Please select a valid neural key from a paid GCP project to continue.";
    }
    return "Neural Authorization Failed: Your current key does not have permission for this operation.";
  }

  // Rate Limiting
  if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
    return "Neural Congestion: The model is currently overloaded. Please wait 30-60 seconds.";
  }

  // Safety
  if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
    return "Protocol Breach: The vision was declined by internal safety filters. Try adjusting your prompt.";
  }

  return errorMessage || "Neural Static: An unexpected error occurred during manifestation.";
};

// Generic AI query for text generation tasks
export const queryAssistant = async (prompt: string, history: any[] = []) => {
  try {
    const ai = createAIInstance();
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
  try {
    const ai = createAIInstance();
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
  
  if (isUltra) {
    await ensureProModelKey();
  }

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
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: aspectRatio, ...(isUltra ? { imageSize: "2K" } : {}) },
        ...(isUltra ? { tools: [{ googleSearch: {} }] } : {})
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
      throw new Error(refusalText ? `Neural Refusal: ${refusalText}` : "Neural static: No visual data returned.");
    }
    return imageUrl;
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || (error as any).message || "Manifestation failure.");
  }
};

// Live Search: Uses Google Search grounding.
export const searchInternet = async (query: string) => {
  try {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide detailed report on: ${query}.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    return {
      text: response.text || "",
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
  try {
    const ai = createAIInstance();
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
  try {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 creative anime scene prompts for 2026. Comma-separated list.`,
    });
    return (response.text || "").split(',').map(s => s.trim()).filter(s => s !== "");
  } catch (error: any) {
    return ["Neo-Tokyo sunset", "Futuristic mecha repair shop", "Cyberpunk rain", "Ghibli style cottage", "Floating island"];
  }
};

// Audio Decoding (Manual PCM implementation as per guidelines)
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Base64 Encoding (Manual implementation as per guidelines)
export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 Decoding (Manual implementation as per guidelines)
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Speech Generation using gemini-2.5-flash-preview-tts
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  try {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned from TTS.");
    return base64Audio;
  } catch (error: any) {
    const msg = await handleAIError(error);
    throw new Error(msg || "Speech generation failed.");
  }
};

// Voice Preview helper for settings and companion
export const generateVoicePreview = (voiceName: string) => 
  generateSpeech(`Hello, I am ${voiceName}. Ready for synchronization.`, voiceName);

// Fetch Upcoming Nexus (Search grounding report)
export const fetchUpcomingNexus = async (category: string) => {
  try {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed report on the future of ${category} in 2025 and 2026.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    return {
      text: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        web: { title: chunk.web?.title || 'Nexus Source', uri: chunk.web?.uri }
      })).filter((s: any) => s.web.uri).map((s: any) => s.web) || []
    };
  } catch (error: any) {
    const handledMessage = await handleAIError(error);
    throw new Error(handledMessage || "Nexus bridge failed.");
  }
};
