import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const MAX_ITEMS = 5;

const SUGGESTIONS = [
  'No smoking',
  'Must love dogs',
  'Kids-friendly',
  'No long-distance',
  'Active lifestyle',
  'Career-oriented',
  'Family values',
  'Same religion',
  'No drugs',
  'Emotionally available',
];

const NonNegotiablesEditor = () => {
  const { profile, updateProfile, fetchProfile } = useProfile();
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.non_negotiables) {
      setItems(profile.non_negotiables);
    }
  }, [profile?.non_negotiables]);

  const handleAddItem = async (item: string) => {
    if (!item.trim() || items.length >= MAX_ITEMS || items.includes(item)) return;
    
    setSaving(true);
    const updatedItems = [...items, item.trim()];
    const { error } = await updateProfile({ non_negotiables: updatedItems });
    
    if (!error) {
      setItems(updatedItems);
      setNewItem('');
      fetchProfile();
    } else {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleRemoveItem = async (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    const { error } = await updateProfile({ non_negotiables: updatedItems });
    
    if (!error) {
      setItems(updatedItems);
      fetchProfile();
    }
  };

  const availableSuggestions = SUGGESTIONS.filter(s => !items.includes(s));

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-4 md:p-6 space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Shield className="w-5 h-5 text-destructive" />
        Non-Negotiables ({items.length}/{MAX_ITEMS})
      </h3>
      
      <p className="text-xs text-muted-foreground">
        Things you won't compromise on in a relationship
      </p>

      {/* Current Items */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {items.map((item, idx) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium border-2 border-destructive/30"
            >
              {item}
              <button
                onClick={() => handleRemoveItem(idx)}
                className="hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Custom Item */}
      {items.length < MAX_ITEMS && (
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a non-negotiable..."
            className="flex-1 border-2 border-foreground text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem(newItem)}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={() => handleAddItem(newItem)}
            disabled={!newItem.trim() || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Suggestions */}
      {items.length < MAX_ITEMS && availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleAddItem(suggestion)}
                className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NonNegotiablesEditor;
