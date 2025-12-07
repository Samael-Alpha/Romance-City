import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import { GameScreenState, GameState, Player } from './types';
import { initializeGemini, setApiKey } from './services/geminiService';
import { INITIAL_STATS, DEFAULT_PLAYER_APPEARANCE } from './constants';

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreenState>(GameScreenState.API_KEY_SELECT);
  const [gameState, setGameState] = useState<GameState | undefined>(undefined);
  const [playerName, setPlayerName] = useState("Hero");

  // Load from local storage on mount
  useEffect(() => {
    // Check for API key logic would go here if we were checking environment vs user input
    // For this implementation, we force the user to "Select Key" via the mock/real flow if not in env
    if (process.env.API_KEY) {
        initializeGemini();
        setScreen(GameScreenState.MENU);
    }
  }, []);

  const handleApiKeySelect = async () => {
      // Logic for Window.AI or manual input
      if (window.aistudio && window.aistudio.openSelectKey) {
        try {
            await window.aistudio.openSelectKey();
            if (await window.aistudio.hasSelectedApiKey()) {
                initializeGemini(); // Should pick up the key
                setScreen(GameScreenState.MENU);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to select API Key.");
        }
      } else {
        // Fallback for demo if no AI Studio window object (Manual Paste)
        const key = prompt("Please enter your Gemini API Key:");
        if (key) {
            setApiKey(key);
            setScreen(GameScreenState.MENU);
        }
      }
  };

  const startNewGame = () => {
    setScreen(GameScreenState.CREATE_CHARACTER);
  };

  const confirmCharacter = () => {
    const newPlayer: Player = {
        name: playerName,
        appearance: DEFAULT_PLAYER_APPEARANCE,
        stats: INITIAL_STATS
    };
    // Clear old saves for a fresh start logic could go here
    setGameState(undefined); 
    setScreen(GameScreenState.GAMEPLAY);
  };

  const loadGame = () => {
    const saved = localStorage.getItem('sca_save_state');
    if (saved) {
      setGameState(JSON.parse(saved));
      setScreen(GameScreenState.GAMEPLAY);
    } else {
      alert("No save found!");
    }
  };

  const saveGame = (state: GameState) => {
    localStorage.setItem('sca_save_state', JSON.stringify(state));
    setGameState(state); // Update local ref
  };

  const exitGame = () => {
    setScreen(GameScreenState.MENU);
  };

  return (
    <div className="w-screen h-screen bg-gray-900 text-white font-sans overflow-hidden select-none">
      
      {/* API Key Screen */}
      {screen === GameScreenState.API_KEY_SELECT && (
         <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 bg-gradient-to-br from-blue-900 to-black">
            <h1 className="text-4xl font-comic font-bold text-orange-500 tracking-wider">Romance City Adventures</h1>
            <p className="max-w-md text-center text-gray-300">
               Welcome to your open-world adventure. To begin, please provide a Google Gemini API Key.
            </p>
            <button 
                onClick={handleApiKeySelect}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform transform hover:scale-105"
            >
                Select/Enter API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                Get an API Key
            </a>
         </div>
      )}

      {/* Main Menu */}
      {screen === GameScreenState.MENU && (
        <div className="flex flex-col items-center justify-center h-full space-y-6 relative">
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40" style={{backgroundImage: 'url(https://picsum.photos/1920/1080?blur=5)'}}></div>
            <div className="z-10 flex flex-col items-center gap-6 p-10 bg-black/60 rounded-xl backdrop-blur-sm border border-orange-500/30">
                <h1 className="text-6xl font-comic font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 drop-shadow-lg">
                    Romance City
                </h1>
                <h2 className="text-2xl font-light text-gray-200 tracking-widest uppercase">Adventures</h2>
                
                <div className="flex flex-col gap-4 w-64 mt-8">
                    <button onClick={startNewGame} className="vn-button py-3 rounded text-xl font-bold">New Game</button>
                    <button onClick={loadGame} className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 text-white py-3 rounded text-xl font-bold transition-all">Load Game</button>
                </div>
            </div>
            <div className="absolute bottom-4 text-xs text-gray-500 z-10">v1.0.0 - Powered by Gemini</div>
        </div>
      )}

      {/* Character Creation */}
      {screen === GameScreenState.CREATE_CHARACTER && (
        <div className="flex flex-col items-center justify-center h-full bg-slate-900">
            <div className="glass-panel p-8 rounded-xl max-w-lg w-full">
                <h2 className="text-3xl font-bold mb-6 text-orange-400">Who are you?</h2>
                
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Name</label>
                    <input 
                        type="text" 
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none text-lg"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Appearance (Fixed for Story)</label>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700 text-gray-300 italic">
                        {DEFAULT_PLAYER_APPEARANCE}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Starting Stats</label>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-900/50 p-2 rounded border border-green-700">STR: MAX</div>
                        <div className="bg-blue-900/50 p-2 rounded border border-blue-700">INT: MAX</div>
                        <div className="bg-pink-900/50 p-2 rounded border border-pink-700">CHA: MAX</div>
                    </div>
                    <div className="mt-2 text-center text-yellow-500 text-sm">Money: Unlimited</div>
                </div>

                <button onClick={confirmCharacter} className="w-full vn-button py-3 rounded font-bold text-lg mt-4">
                    Begin Adventure
                </button>
                <button onClick={() => setScreen(GameScreenState.MENU)} className="w-full text-gray-400 hover:text-white mt-4 text-sm">
                    Back
                </button>
            </div>
        </div>
      )}

      {/* Gameplay */}
      {screen === GameScreenState.GAMEPLAY && (
        <GameScreen 
            initialPlayer={{
                name: playerName,
                appearance: DEFAULT_PLAYER_APPEARANCE,
                stats: INITIAL_STATS
            }}
            loadedState={gameState}
            onSave={saveGame}
            onExit={exitGame}
        />
      )}
    </div>
  );
};

export default App;