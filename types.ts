
export interface UserProfile {
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export interface AnimeCharacter {
  id: string;
  name: string;
  title: string;
  personality: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    charisma: number;
  };
  backstory: string;
  specialMove: string;
  portrait?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  style: AnimeStyle;
  aspect: AspectRatio;
  detail: DetailLevel;
  isReference?: boolean;
}

export enum AppTab {
  FORGE = 'forge',
  ARTIST = 'artist',
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

// Interface for QuizMaster state
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
  | 'Cyberpunk' 
  | 'Studio Ghibli' 
  | 'Makoto Shinkai' 
  | 'Mappa Style' 
  | 'Ufotable Style' 
  | 'Dark Fantasy' 
  | 'Retro 90s' 
  | 'Ukiyo-e' 
  | 'Watercolor' 
  | 'Noir';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type DetailLevel = 'Standard' | 'High' | 'Ultra';
