import { motion } from 'framer-motion';
import { useState } from 'react';

interface VibeSelectorProps {
  selectedVibe: string;
  onVibeChange: (vibe: string) => void;
}

const vibes = [
  { id: 'chill', emoji: '😌', label: 'Chill & Slow', color: 'from-blue-400 to-blue-600' },
  { id: 'deep_talks', emoji: '🌙', label: 'Deep Talks', color: 'from-purple-400 to-purple-600' },
  { id: 'fun_chaotic', emoji: '🎉', label: 'Fun & Chaotic', color: 'from-orange-400 to-red-500' },
  { id: 'energetic', emoji: '⚡', label: 'Energetic', color: 'from-yellow-400 to-orange-500' },
  { id: 'romantic', emoji: '💕', label: 'Romantic', color: 'from-pink-400 to-rose-500' },
  { id: 'adventurous', emoji: '🏔️', label: 'Adventurous', color: 'from-green-400 to-emerald-600' },
];

const VibeSelector = ({ selectedVibe, onVibeChange }: VibeSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <span className="text-lg">✨</span> Today's Vibe
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {vibes.map((vibe) => (
          <motion.button
            key={vibe.id}
            onClick={() => onVibeChange(vibe.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-xl border-2 transition-all text-center ${
              selectedVibe === vibe.id
                ? 'border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                : 'border-border hover:border-foreground bg-card'
            }`}
          >
            <span className="text-2xl block mb-1">{vibe.emoji}</span>
            <span className="text-xs font-medium">{vibe.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default VibeSelector;
