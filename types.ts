export enum GameScreenState {
  MENU = 'MENU',
  CREATE_CHARACTER = 'CREATE_CHARACTER',
  GAMEPLAY = 'GAMEPLAY',
  API_KEY_SELECT = 'API_KEY_SELECT'
}

export interface PlayerStats {
  strength: number;
  intelligence: number;
  charisma: number;
  money: number;
}

export interface NPC {
  name: string;
  description: string;
  compliance: number; // 0-100
  affection: number; // 0-100
  sexualRating: number; // 0-100
  mood: string;
}

export interface Player {
  name: string;
  appearance: string;
  stats: PlayerStats;
}

export interface Choice {
  id: string;
  text: string;
  actionType: 'dialogue' | 'action' | 'travel' | 'intimacy';
}

export interface SceneData {
  location: string;
  backgroundDescription: string;
  narrative: string;
  speaker: string | null;
  speakerEmotion: string | null;
  choices: Choice[];
  visualEffects?: 'shake' | 'flash' | 'bloom' | 'none';
}

export interface GameState {
  player: Player;
  npcs: Record<string, NPC>;
  history: string[]; // Narrative history for context
  currentScene: SceneData;
  backgroundImageUrl: string | null;
}

// API Response structure expected from Gemini
export interface GeminiStoryResponse {
  narrative: string;
  location: string;
  visual_description: string; // Used to generate background
  speaker: string | null;
  speaker_emotion: string | null;
  speaker_visual: string | null; // Used to generate sprite
  choices: {
    text: string;
    type: 'dialogue' | 'action' | 'travel' | 'intimacy';
  }[];
  stat_updates?: Partial<PlayerStats>;
  npc_updates?: {
    name: string;
    stats: Partial<NPC>;
  }[];
  effect?: 'shake' | 'flash' | 'bloom' | 'none';
}
