import { motion } from 'framer-motion';
import { Heart, Users, Clock, Eye } from 'lucide-react';

interface DatingModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

const modes = [
  { 
    id: 'dating', 
    icon: Heart, 
    label: 'Dating', 
    description: 'Looking for romance',
    color: 'text-rose-500'
  },
  { 
    id: 'friends', 
    icon: Users, 
    label: 'Friends', 
    description: 'Just vibes, no pressure',
    color: 'text-blue-500'
  },
  { 
    id: 'slow', 
    icon: Clock, 
    label: 'Slow Dating', 
    description: '1 match per day',
    color: 'text-amber-500'
  },
  { 
    id: 'anonymous', 
    icon: Eye, 
    label: 'Anonymous Crush', 
    description: 'Reveal when mutual',
    color: 'text-purple-500'
  },
];

const DatingModeSelector = ({ selectedMode, onModeChange }: DatingModeSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <span className="text-lg">💝</span> Dating Mode
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedMode === mode.id
                ? 'border-foreground bg-primary/10 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                : 'border-border hover:border-foreground bg-card'
            }`}
          >
            <mode.icon className={`w-6 h-6 mb-2 ${mode.color}`} />
            <span className="font-bold text-sm block">{mode.label}</span>
            <span className="text-xs text-muted-foreground">{mode.description}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DatingModeSelector;
