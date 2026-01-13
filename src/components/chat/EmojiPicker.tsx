import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😗', '😋', '😜', '🤪', '😝', '🤭'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❣️', '💔', '🫶'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🫰', '🤙', '👋', '🤚', '✋', '🖖', '👏', '🙌', '🤝', '🙏', '💪', '🦾', '🫂', '🤗', '🎉'],
  nature: ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '⭐', '🌟', '✨', '💫', '🔥', '💯', '🎶', '🎵', '🦋', '🌈', '☀️', '🌙', '💐', '🍀'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-16 left-0 bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-3 w-72 z-50"
    >
      {/* Category tabs */}
      <div className="flex gap-1 mb-2 border-b-2 border-border pb-2">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as keyof typeof EMOJI_CATEGORIES)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeCategory === cat 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            {cat === 'smileys' && '😊'}
            {cat === 'love' && '❤️'}
            {cat === 'gestures' && '👍'}
            {cat === 'nature' && '🌸'}
          </button>
        ))}
      </div>
      
      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="p-1.5 hover:bg-muted rounded text-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

interface EmojiButtonProps {
  onSelect: (emoji: string) => void;
}

export const EmojiButton = ({ onSelect }: EmojiButtonProps) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPicker(!showPicker)}
      >
        <Smile className="w-5 h-5" />
      </Button>
      
      <AnimatePresence>
        {showPicker && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPicker(false)} 
            />
            <EmojiPicker 
              onSelect={onSelect} 
              onClose={() => setShowPicker(false)} 
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
