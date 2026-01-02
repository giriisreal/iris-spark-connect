import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const vibes = [
  { id: 'chill', emoji: '😌', label: 'Chill & Slow' },
  { id: 'deep_talks', emoji: '🌙', label: 'Deep Talks' },
  { id: 'fun_chaotic', emoji: '🎉', label: 'Fun & Chaotic' },
  { id: 'energetic', emoji: '⚡', label: 'Energetic' },
  { id: 'romantic', emoji: '💕', label: 'Romantic' },
  { id: 'adventurous', emoji: '🏔️', label: 'Adventurous' },
];

const VibeSelector = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const selectedVibe = profile?.vibe_status || 'chill';

  const handleVibeChange = async (vibe: string) => {
    const { error } = await updateProfile({ vibe_status: vibe });
    if (!error) {
      toast({ title: 'Vibe updated! ✨', description: `You're feeling ${vibe.replace('_', ' ')} today` });
    }
  };

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-3">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <span className="text-lg">✨</span> Today's Vibe
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {vibes.map((vibe) => (
          <motion.button
            key={vibe.id}
            onClick={() => handleVibeChange(vibe.id)}
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
