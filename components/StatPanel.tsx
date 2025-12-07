import React from 'react';
import { Player, NPC } from '../types';

interface StatPanelProps {
  player: Player;
  currentNpc?: NPC;
}

const StatPanel: React.FC<StatPanelProps> = ({ player, currentNpc }) => {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-4 max-w-[200px]">
      {/* Player Stats */}
      <div className="glass-panel rounded-lg p-3 text-xs md:text-sm text-white">
        <h3 className="font-bold text-orange-400 mb-2 border-b border-gray-600 pb-1">{player.name}</h3>
        <div className="space-y-1">
          <div className="flex justify-between"><span>STR:</span> <span className="text-green-400">{player.stats.strength}</span></div>
          <div className="flex justify-between"><span>INT:</span> <span className="text-blue-400">{player.stats.intelligence}</span></div>
          <div className="flex justify-between"><span>CHA:</span> <span className="text-pink-400">{player.stats.charisma}</span></div>
          <div className="flex justify-between mt-2 font-bold text-yellow-400"><span>$:</span> <span>{player.stats.money.toLocaleString()}</span></div>
        </div>
      </div>

      {/* Target NPC Stats (Contextual) */}
      {currentNpc && (
        <div className="glass-panel rounded-lg p-3 text-xs md:text-sm text-white border-pink-500 border">
          <h3 className="font-bold text-pink-400 mb-2 border-b border-gray-600 pb-1">{currentNpc.name}</h3>
          <div className="space-y-1">
             <div className="flex justify-between"><span>Mood:</span> <span>{currentNpc.mood}</span></div>
             
             <div className="w-full bg-gray-700 h-2 rounded mt-1 overflow-hidden">
               <div className="bg-blue-500 h-full" style={{width: `${currentNpc.compliance}%`}}></div>
             </div>
             <div className="text-[10px] text-right text-gray-400">Compliance</div>

             <div className="w-full bg-gray-700 h-2 rounded mt-1 overflow-hidden">
               <div className="bg-red-500 h-full" style={{width: `${currentNpc.affection}%`}}></div>
             </div>
             <div className="text-[10px] text-right text-gray-400">Affection</div>

             <div className="w-full bg-gray-700 h-2 rounded mt-1 overflow-hidden">
               <div className="bg-purple-500 h-full" style={{width: `${currentNpc.sexualRating}%`}}></div>
             </div>
             <div className="text-[10px] text-right text-gray-400">Corruption</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatPanel;
