import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Plus, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const SUGGESTED_INTERESTS = [
  'Music', 'Travel', 'Gaming', 'Cooking', 'Fitness', 'Art',
  'Photography', 'Movies', 'Reading', 'Hiking', 'Yoga', 'Coffee',
  'Fashion', 'Tech', 'Sports', 'Dancing', 'Wine', 'Pets',
  'Meditation', 'Concerts', 'Foodie', 'Nature', 'Beach', 'Netflix',
];

const InterestsEditor = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.interests) {
      setInterests(profile.interests);
    }
  }, [profile?.interests]);

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < 15) {
      setInterests([...interests, trimmed]);
      setNewInterest('');
      setHasChanges(true);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await updateProfile({ interests });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save interests',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved!',
        description: 'Your interests have been updated',
      });
      setHasChanges(false);
    }
    
    setSaving(false);
  };

  const suggestionsToShow = SUGGESTED_INTERESTS.filter(
    s => !interests.includes(s)
  ).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-foreground">Interests</h3>
        </div>
        <span className="text-xs text-muted-foreground">{interests.length}/15</span>
      </div>

      {/* Current Interests */}
      <div className="flex flex-wrap gap-2 min-h-[60px]">
        <AnimatePresence mode="popLayout">
          {interests.map((interest) => (
            <motion.span
              key={interest}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] flex items-center gap-1 group"
            >
              {interest}
              <button
                onClick={() => removeInterest(interest)}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        
        {interests.length === 0 && (
          <p className="text-sm text-muted-foreground">No interests added yet</p>
        )}
      </div>

      {/* Add Custom Interest */}
      <div className="flex gap-2">
        <Input
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addInterest(newInterest)}
          placeholder="Add custom interest..."
          className="flex-1 border-2 border-foreground"
          maxLength={20}
        />
        <Button
          variant="retro"
          size="icon"
          onClick={() => addInterest(newInterest)}
          disabled={!newInterest.trim() || interests.length >= 15}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Quick add:</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestionsToShow.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addInterest(suggestion)}
              className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary hover:text-primary-foreground transition-colors border border-muted-foreground/20"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="hero"
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InterestsEditor;
