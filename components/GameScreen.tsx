import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameScreenState, GeminiStoryResponse, Choice, Player } from '../types';
import { generateStoryStep, generateImage } from '../services/geminiService';
import DialogueBox from './DialogueBox';
import StatPanel from './StatPanel';

interface GameScreenProps {
  initialPlayer: Player;
  onSave: (state: GameState) => void;
  onExit: () => void;
  loadedState?: GameState;
}

const GameScreen: React.FC<GameScreenProps> = ({ initialPlayer, onSave, onExit, loadedState }) => {
  const [gameState, setGameState] = useState<GameState>(loadedState || {
    player: initialPlayer,
    npcs: {},
    history: [],
    currentScene: {
      location: "City Center",
      backgroundDescription: "A bustling modern city center with skyscrapers and parks.",
      narrative: "You arrive in the city, ready for a new life.",
      speaker: null,
      speakerEmotion: null,
      choices: [
        { id: 'start', text: 'Look around', actionType: 'action' }
      ],
      visualEffects: 'none'
    },
    backgroundImageUrl: null
  });

  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [visualEffect, setVisualEffect] = useState<'shake' | 'flash' | 'bloom' | 'none'>('none');

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onSave(gameState);
      console.log("Auto-saved");
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState, onSave]);

  // Initial Scene Image Load
  useEffect(() => {
    if (!gameState.backgroundImageUrl && gameState.currentScene.backgroundDescription) {
       loadSceneImages(gameState.currentScene.backgroundDescription, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSceneImages = async (bgDesc: string, speakerVisual: string | null) => {
    // Determine prompt based on whether a character is present
    let prompt = bgDesc;
    let type: 'background' | 'scene' = 'background';

    if (speakerVisual) {
       prompt = `${bgDesc}. A character is present in the scene: ${speakerVisual}`;
       type = 'scene';
    }

    // Get the URL (generation is handled via URL parameters on the service side)
    const imageUrl = await generateImage(prompt, type);
    
    // Preload image to prevent blank screen during fetch
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
        setGameState(prev => ({
            ...prev,
            backgroundImageUrl: imageUrl,
        }));
    };
  };

  const handleChoice = async (choiceText: string) => {
    setLoading(true);
    setVisualEffect('none');

    // Add user choice to history
    const updatedHistory = [...gameState.history, `User Choice: ${choiceText}`];

    try {
      const response: GeminiStoryResponse = await generateStoryStep(
        updatedHistory,
        choiceText,
        gameState
      );

      // Handle Stats Update
      let updatedPlayer = { ...gameState.player };
      if (response.stat_updates) {
        updatedPlayer.stats = { ...updatedPlayer.stats, ...response.stat_updates };
      }

      // Handle NPC Updates
      let updatedNpcs = { ...gameState.npcs };
      if (response.npc_updates) {
        response.npc_updates.forEach(update => {
           const existing = updatedNpcs[update.name] || {
             name: update.name,
             description: "Met in " + response.location,
             compliance: 0,
             affection: 0,
             sexualRating: 0,
             mood: "Neutral"
           };
           updatedNpcs[update.name] = { ...existing, ...update.stats };
        });
      }

      // Determine if visual update is needed
      const isNewLocation = response.location !== gameState.currentScene.location;
      // We always refresh visual if there is a speaker change to show them in the scene
      const speakerChanged = response.speaker !== gameState.currentScene.speaker;
      
      // Update State
      setGameState(prev => ({
        ...prev,
        player: updatedPlayer,
        npcs: updatedNpcs,
        history: [...updatedHistory, `System: ${response.narrative}`],
        currentScene: {
          location: response.location,
          backgroundDescription: response.visual_description,
          narrative: response.narrative,
          speaker: response.speaker,
          speakerEmotion: response.speaker_emotion,
          choices: response.choices.map((c, i) => ({
            id: `c_${i}`,
            text: c.text,
            actionType: c.type
          })),
          visualEffects: response.effect || 'none'
        }
      }));

      // Trigger visual effect
      if (response.effect && response.effect !== 'none') {
        setVisualEffect(response.effect);
        setTimeout(() => setVisualEffect('none'), 1000);
      }

      // Refresh image if location changes OR if speaker status changes (someone appears/leaves/changes)
      if (isNewLocation || speakerChanged || response.speaker_visual) {
         loadSceneImages(response.visual_description, response.speaker_visual);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentNpc = gameState.currentScene.speaker ? gameState.npcs[gameState.currentScene.speaker] : undefined;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${visualEffect === 'shake' ? 'animate-shake' : ''}`}>
      
      {/* Background Layer - Now contains the full scene including characters */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out animate-breathe origin-center"
        style={{ 
            backgroundImage: gameState.backgroundImageUrl ? `url(${gameState.backgroundImageUrl})` : 'none',
            backgroundColor: '#1a1a1a',
            backgroundSize: '110%' // Zoomed in slightly to allow breathe animation
        }}
      >
        {!gameState.backgroundImageUrl && (
            <div className="flex items-center justify-center h-full text-gray-600">Generating Visuals...</div>
        )}
      </div>

      {/* Bloom Effect Overlay */}
      {visualEffect === 'bloom' && (
        <div className="absolute inset-0 bg-white opacity-20 pointer-events-none mix-blend-overlay animate-pulse" />
      )}

      {/* UI Layer */}
      <StatPanel player={gameState.player} currentNpc={currentNpc} />

      <div className="absolute top-4 right-4 z-30 flex gap-2">
         <button onClick={() => onSave(gameState)} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded border border-green-400">Save</button>
         <button onClick={onExit} className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded border border-red-400">Exit</button>
      </div>

      <DialogueBox 
        speaker={gameState.currentScene.speaker}
        text={gameState.currentScene.narrative}
        choices={gameState.currentScene.choices}
        onChoose={(c) => handleChoice(c.text)}
        loading={loading}
        manualInput={manualInput}
        setManualInput={setManualInput}
        onManualSubmit={() => {
            if(manualInput.trim()) {
                handleChoice(manualInput);
                setManualInput("");
            }
        }}
      />
    </div>
  );
};

export default GameScreen;
