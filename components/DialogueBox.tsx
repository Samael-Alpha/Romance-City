import React from 'react';
import { Choice } from '../types';

interface DialogueBoxProps {
  speaker: string | null;
  text: string;
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  loading: boolean;
  manualInput: string;
  setManualInput: (val: string) => void;
  onManualSubmit: () => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  speaker, 
  text, 
  choices, 
  onChoose, 
  loading,
  manualInput,
  setManualInput,
  onManualSubmit
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full p-4 z-20 flex flex-col items-center">
      
      {/* Choices Layer - Floating above text box */}
      {!loading && choices.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-4 max-w-4xl w-full">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => onChoose(choice)}
              className="vn-button px-6 py-2 rounded-lg font-bold text-sm md:text-base min-w-[150px] shadow-lg"
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* Main Text Box */}
      <div className="glass-panel w-full max-w-5xl rounded-xl p-6 min-h-[180px] flex flex-col relative border-t-4 border-orange-500">
        
        {/* Name Tag */}
        {speaker && (
          <div className="absolute -top-5 left-8 bg-orange-500 text-white font-bold px-6 py-1 rounded-t-lg shadow-md text-xl font-comic border-2 border-white">
            {speaker}
          </div>
        )}

        {/* Narrative Text */}
        <div className="flex-grow mt-2">
          <p className="text-lg md:text-xl leading-relaxed text-gray-100 font-medium drop-shadow-md">
            {loading ? (
              <span className="animate-pulse text-gray-400">Processing scenario...</span>
            ) : (
              text
            )}
          </p>
        </div>

        {/* Custom Input (God Mode/Custom Actions) */}
        {!loading && (
          <div className="mt-4 flex gap-2 border-t border-gray-600 pt-3">
             <input 
                type="text" 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type a custom action..."
                className="bg-gray-800 text-white px-3 py-1 rounded w-full border border-gray-600 focus:border-orange-500 outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onManualSubmit()}
             />
             <button 
               onClick={onManualSubmit}
               className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold border border-gray-500"
             >
               Go
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogueBox;
