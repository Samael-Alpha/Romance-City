import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiStoryResponse, GameState } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("API Key not found in environment variables. Waiting for user input.");
  }
};

export const setApiKey = (key: string) => {
  genAI = new GoogleGenAI({ apiKey: key });
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING },
    location: { type: Type.STRING },
    visual_description: { type: Type.STRING },
    speaker: { type: Type.STRING, nullable: true },
    speaker_emotion: { type: Type.STRING, nullable: true },
    speaker_visual: { type: Type.STRING, nullable: true },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['dialogue', 'action', 'travel', 'intimacy'] },
        },
        required: ['text', 'type']
      }
    },
    stat_updates: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        strength: { type: Type.NUMBER, nullable: true },
        intelligence: { type: Type.NUMBER, nullable: true },
        charisma: { type: Type.NUMBER, nullable: true },
        money: { type: Type.NUMBER, nullable: true },
      }
    },
    npc_updates: {
      type: Type.ARRAY,
      nullable: true,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          stats: {
             type: Type.OBJECT,
             properties: {
               compliance: { type: Type.NUMBER, nullable: true },
               affection: { type: Type.NUMBER, nullable: true },
               sexualRating: { type: Type.NUMBER, nullable: true },
               mood: { type: Type.STRING, nullable: true },
             }
          }
        }
      }
    },
    effect: { type: Type.STRING, enum: ['shake', 'flash', 'bloom', 'none'], nullable: true }
  },
  required: ['narrative', 'location', 'visual_description', 'choices']
};

export const generateStoryStep = async (
  previousHistory: string[],
  playerInput: string,
  currentState: GameState
): Promise<GeminiStoryResponse> => {
  if (!genAI) throw new Error("Gemini API not initialized");

  const model = "gemini-2.5-flash"; 

  const context = `
    Current Player: ${currentState.player.name}
    Appearance: ${currentState.player.appearance}
    Stats: Strength ${currentState.player.stats.strength}, Int ${currentState.player.stats.intelligence}, Cha ${currentState.player.stats.charisma}, Money ${currentState.player.stats.money}.
    Current Location: ${currentState.currentScene.location}
    Known NPCs: ${JSON.stringify(currentState.npcs)}
    
    Recent History:
    ${previousHistory.slice(-5).join("\n")}
    
    User Action: ${playerInput}
  `;

  let lastError: any;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: model,
        contents: context,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.9, 
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
          ]
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as GeminiStoryResponse;
      }
      
      console.warn(`Attempt ${attempt + 1}: Empty response text. Candidates:`, response.candidates);
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Default backoff: 2s, 4s, 8s
      let delay = 2000 * Math.pow(2, attempt); 
      
      // If rate limit hit (429), use a much longer backoff: 5s, 10s, 20s
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
         console.warn("Rate limit hit, waiting longer...");
         delay = 5000 * Math.pow(2, attempt); 
      }

      await new Promise(resolve => setTimeout(resolve, delay)); 
    }
  }

  console.error("All retry attempts failed.", lastError);
  
  // Fallback response to keep game alive and inform user of specific issue
  let fallbackNarrative = "The world seems to pause... (AI Error. Please try again.)";
  let fallbackChoices: GeminiStoryResponse['choices'] = [{ text: "Try again", type: "action" }];

  if (lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
      fallbackNarrative = "The city is too busy right now (Rate Limit Exceeded). Please wait a few seconds before making your next choice.";
      fallbackChoices = [{ text: "Wait and Continue", type: "action" }];
  }

  return {
    narrative: fallbackNarrative,
    location: currentState.currentScene.location,
    visual_description: currentState.currentScene.backgroundDescription,
    speaker: null,
    speaker_emotion: null,
    speaker_visual: null,
    choices: fallbackChoices,
    effect: "none"
  };
};

export const generateImage = async (prompt: string, type: 'background' | 'scene'): Promise<string> => {
  // Using Pollinations AI to provide free, unrestricted, high-quality images similar to Perchance style generators.
  // This avoids the need for a paid API key for images and supports the requested visual style.
  
  const baseStyle = "Summertime Saga style, western visual novel art, 2d cartoon, high quality, american cartoon style, vibrant colors, clean lines, detailed background";
  
  // Enhance prompt for the specific model behavior
  let finalPrompt = `${baseStyle}, ${prompt}`;
  if (type === 'background') {
    finalPrompt += ", no characters, scenery only, wide shot, empty room";
  } else {
    finalPrompt += ", with characters in the scene, character focus, interaction, detailed character design";
  }

  const encoded = encodeURIComponent(finalPrompt);
  const seed = Math.floor(Math.random() * 1000000);
  
  // Using 'flux' model as it provides high fidelity 2D art styles compatible with the request.
  // Pollinations handles the generation freely.
  return `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;
};