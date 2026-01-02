import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const MAX_LINES = 5;

const PickupLinesEditor = () => {
  const { profile, updateProfile, fetchProfile } = useProfile();
  const [lines, setLines] = useState<string[]>([]);
  const [newLine, setNewLine] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLines(profile?.pickup_lines ?? []);
  }, [profile?.pickup_lines]);

  const handleAddLine = async () => {
    if (!profile) {
      toast({ title: 'Profile not loaded yet', variant: 'destructive' });
      return;
    }
    if (!newLine.trim() || lines.length >= MAX_LINES) return;

    setSaving(true);
    const updatedLines = [...lines, newLine.trim()];
    const { error } = await updateProfile({ pickup_lines: updatedLines });

    if (!error) {
      setLines(updatedLines);
      setNewLine('');
      fetchProfile();
    } else {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleRemoveLine = async (index: number) => {
    if (!profile) return;
    const updatedLines = lines.filter((_, i) => i !== index);
    const { error } = await updateProfile({ pickup_lines: updatedLines });

    if (!error) {
      setLines(updatedLines);
      fetchProfile();
    }
  };

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-4 md:p-6 space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-secondary" />
        Pickup Lines ({lines.length}/{MAX_LINES})
      </h3>
      
      <p className="text-xs text-muted-foreground">
        Add your best conversation starters for matches to use
      </p>

      {/* Existing Lines */}
      <div className="space-y-2">
        <AnimatePresence>
          {lines.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border-2 border-secondary/30"
            >
              <span className="text-lg">💬</span>
              <p className="flex-1 text-sm text-foreground">"{line}"</p>
              <button
                onClick={() => handleRemoveLine(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add New Line */}
      {lines.length < MAX_LINES && (
        <div className="flex gap-2">
          <Input
            value={newLine}
            onChange={(e) => setNewLine(e.target.value)}
            placeholder="Add a pickup line..."
            className="flex-1 border-2 border-foreground text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddLine()}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={handleAddLine}
            disabled={!newLine.trim() || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PickupLinesEditor;
