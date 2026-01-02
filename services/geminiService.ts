
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const ensureProModelKey = async () => {
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
};

export const createAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The system link requires an API key. Please ensure it is configured in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decoding failed", e);
    return new Uint8Array(0);
  }
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

const withRetry = async <T>(fn: () => Promise<T>, retries = 4, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isTransient = 
      errorMessage.toLowerCase().includes("network error") || 
      errorMessage.toLowerCase().includes("fetch failed") || 
      errorMessage.toLowerCase().includes("failed to fetch") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") || 
      errorMessage.includes("429") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("NetworkError");
    
    if (retries > 0 && isTransient) {
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const handleAIError = async (error: any): Promise<string | null> => {
  let errorMessage = error?.message || (error?.error && error.error.message) || String(error);
  if (errorMessage.includes("API_KEY_MISSING")) return "Neural Key Missing.";
  const lowMsg = errorMessage.toLowerCase();
  if (lowMsg.includes("network error") || lowMsg.includes("failed to fetch")) return "Neural Link Offline.";
  if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) return "Neural Congestion: Too many requests.";
  return `Neural Error: ${errorMessage.slice(0, 150)}`;
};

export const queryAssistant = async (prompt: string) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response;
  });
};

export const manifestIdea = async (intent: string, category: string) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Manifest the following idea into a structured form.
      Category: ${category}
      Idea: ${intent}
      
      Provide a title, a detailed manifestation description, a matching narrative scene, a concise snapshot (profile), an optimized visual prompt for image generation, and a focused affirmation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            scene: { type: Type.STRING },
            snapshot: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            affirmation: { type: Type.STRING },
          },
          required: ["title", "description", "scene", "snapshot", "visualPrompt", "affirmation"],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  });
};

export const forgeCharacter = async (prompt: string) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Forge a high-quality original anime character based on this theme: ${prompt}. Expanded stats (0-100), rich backstory, and unique special move.`,
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
                speed: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                endurance: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                luck: { type: Type.INTEGER },
              },
              required: ["strength", "speed", "intelligence", "endurance", "agility", "luck"],
            },
            backstory: { type: Type.STRING },
            specialMove: { type: Type.STRING },
          },
          required: ["id", "name", "title", "personality", "stats", "backstory", "specialMove"],
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    return { ...parsed, outfits: [{ name: 'Default', portrait: '' }], currentOutfitIndex: 0, isPinned: false };
  });
};

export const forgeWorld = async (prompt: string) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Design an original anime world based on: ${prompt}. Provide name, era, magic system, factions, and a visual description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            era: { type: Type.STRING },
            description: { type: Type.STRING },
            magicSystem: { type: Type.STRING },
            factions: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualPrompt: { type: Type.STRING },
          },
          required: ["id", "name", "era", "description", "magicSystem", "factions", "visualPrompt"],
        },
      },
    });
    return { ...JSON.parse(response.text || '{}'), isPinned: false };
  });
};

export const generateStory = async (
  title: string, 
  world: any, 
  characters: any[], 
  genre: string, 
  tone: string, 
  chapterNum: number,
  previousContext: string = ""
) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const prompt = `Write Episode/Chapter ${chapterNum} of an original anime story titled "${title}".
    World: ${world.name} (${world.description}).
    Characters: ${characters.map(c => `${c.name} (${c.personality})`).join(', ')}.
    Genre: ${genre}. Tone: ${tone}.
    Previous context: ${previousContext || "None - this is the beginning."}
    Include an opening hook, rising conflict, character development, and a climax.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    return response.text || "Failed to manifest story thread.";
  });
};

export const imagineScene = async (prompt: string, style: string, aspect: string, detail: string): Promise<string> => {
  return withRetry(async () => {
    const isUltra = detail === 'Ultra';
    if (isUltra) await ensureProModelKey();
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: isUltra ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
      contents: `High detail anime: ${prompt}. Style: ${style}.`,
      config: { imageConfig: { aspectRatio: aspect as any } },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("Manifestation failed.");
    return `data:image/png;base64,${part.inlineData.data}`;
  });
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Speech link failed.");
    return base64Audio;
  });
};

export const generateVoicePreview = (voiceName: string) => 
  generateSpeech(`Neural link established. System operational.`, voiceName);

export const searchInternet = async (query: string) => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: { tools: [{ googleSearch: {} }] },
    });
    return {
      text: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || []
    };
  });
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 search suggestions for: "${query}". CSV format.`,
    });
    return (response.text || "").split(',').map(s => s.trim()).filter(Boolean);
  });
};

export const getSceneSuggestions = async (): Promise<string[]> => {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Suggest 5 anime scene prompts. CSV format.",
    });
    return (response.text || "").split(',').map(s => s.trim()).filter(Boolean);
  });
};

export async function fetchUpcomingNexus(cat: string) {
  return withRetry(async () => {
    const ai = createAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Future of ${cat} 2026.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return {
      text: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || []
    };
  });
}
