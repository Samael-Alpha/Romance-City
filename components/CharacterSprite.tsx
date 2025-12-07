import React from 'react';

interface CharacterSpriteProps {
  imageUrl: string | null;
  emotion: string | null;
  name: string | null;
}

const CharacterSprite: React.FC<CharacterSpriteProps> = ({ imageUrl, emotion, name }) => {
  if (!imageUrl || !name) return null;

  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
      <div className="relative animate-breathe origin-bottom">
        <img 
          src={imageUrl} 
          alt={name} 
          className="max-h-[80vh] object-contain drop-shadow-2xl"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
          }}
        />
        {/* Simple emotion indicator overlay if needed, currently relying on image generation */}
      </div>
    </div>
  );
};

export default CharacterSprite;
