import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isOwn: boolean;
}

const MessageReactions = ({ reactions, onAddReaction, onRemoveReaction, isOwn }: MessageReactionsProps) => {
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  return (
    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => reaction.hasReacted ? onRemoveReaction(reaction.emoji) : onAddReaction(reaction.emoji)}
          className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-0.5 border transition-colors ${
            reaction.hasReacted 
              ? 'bg-primary/20 border-primary' 
              : 'bg-muted border-border hover:border-primary'
          }`}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && <span className="text-muted-foreground">{reaction.count}</span>}
        </button>
      ))}
      
      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowQuickReactions(!showQuickReactions)}
          className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
        
        <AnimatePresence>
          {showQuickReactions && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowQuickReactions(false)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute bottom-6 ${isOwn ? 'right-0' : 'left-0'} bg-card rounded-full border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] px-2 py-1 flex gap-1 z-50`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onAddReaction(emoji);
                      setShowQuickReactions(false);
                    }}
                    className="hover:scale-125 transition-transform text-base p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageReactions;
