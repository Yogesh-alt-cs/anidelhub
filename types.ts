
export interface UserProfile {
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export interface CharacterOutfit {
  name: string;
  portrait: string;
}

export interface AnimeCharacter {
  id: string;
  name: string;
  title: string;
  personality: string;
  stats: {
    strength: number;
    speed: number;
    intelligence: number;
    endurance: number;
    agility: number;
    luck: number;
  };
  backstory: string;
  specialMove: string;
  outfits: CharacterOutfit[];
  currentOutfitIndex: number;
  isPinned: boolean;
}

export interface AnimeWorld {
  id: string;
  name: string;
  era: string;
  description: string;
  magicSystem: string;
  factions: string[];
  visualPrompt: string;
  portrait?: string;
  isPinned: boolean;
}

export interface ManifestItem {
  id: string;
  intent: string;
  category: string;
  title: string;
  description: string;
  scene?: string;
  snapshot?: string;
  visualPrompt?: string;
  affirmation?: string;
  imageUrl?: string;
  timestamp: number;
  isPinned: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  style: AnimeStyle | string;
  aspect: AspectRatio;
  detail: DetailLevel;
  filters?: NeuralFilters;
  isPinned: boolean;
  isFavorite: boolean;
}

export interface NeuralFilters {
  lineArt?: number;
  faceDetail?: number;
  eyeClarity?: number;
  lightingIntensity?: number;
  colorGrading?: 'None' | 'Warm' | 'Cool' | 'Pastel' | 'Neon';
  grain?: boolean;
  shadowDepth?: number;
}

export enum AppTab {
  FORGE = 'forge',
  ARTIST = 'artist',
  WORLD = 'world',
  MANIFEST = 'manifest',
  IMAGINER = 'imaginer',
  COMPANION = 'companion',
  SEARCH = 'search',
  ASSISTANT = 'assistant',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  LOGIN = 'login'
}

export interface TranscriptionItem {
  speaker: 'user' | 'ai';
  text: string;
  id: string;
  sources?: { title: string; uri: string }[];
}

export interface SavedSession {
  id: string;
  timestamp: number;
  history: TranscriptionItem[];
  title: string;
}

export interface QuizState {
  score: number;
  lives: number;
  currentQuestion: number;
  totalQuestions: number;
  isFinished: boolean;
}

export type AnimeStyle = 
  | 'Shonen' 
  | 'Shojo' 
  | 'Seinen'
  | 'Cyberpunk' 
  | 'Studio Ghibli' 
  | 'Makoto Shinkai' 
  | 'Mappa Style' 
  | 'Ufotable Style' 
  | 'Dark Fantasy' 
  | 'Isekai fantasy'
  | 'Samurai / Edo-era anime'
  | 'Mecha'
  | 'Slice of Life'
  | 'Gothic anime'
  | 'Neon sci-fi anime'
  | 'Traditional hand-drawn anime'
  | 'Retro 90s' 
  | 'Ukiyo-e' 
  | 'Watercolor' 
  | 'Noir';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type DetailLevel = 'Standard' | 'High' | 'Ultra';
