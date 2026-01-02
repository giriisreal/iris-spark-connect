import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const MAX_NOTES = 5;

const PersonalNotesEditor = () => {
  const { profile, updateProfile, fetchProfile } = useProfile();
  const [notes, setNotes] = useState<string[]>(profile?.personal_notes || []);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const handleAddNote = async () => {
    if (!newNote.trim() || notes.length >= MAX_NOTES) return;
    
    setSaving(true);
    const updatedNotes = [...notes, newNote.trim()];
    const { error } = await updateProfile({ personal_notes: updatedNotes });
    
    if (!error) {
      setNotes(updatedNotes);
      setNewNote('');
      setShowAdd(false);
      fetchProfile();
    } else {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleRemoveNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    const { error } = await updateProfile({ personal_notes: updatedNotes });
    
    if (!error) {
      setNotes(updatedNotes);
      fetchProfile();
    }
  };

  const noteColors = [
    'bg-yellow-100 border-yellow-300',
    'bg-pink-100 border-pink-300',
    'bg-blue-100 border-blue-300',
    'bg-green-100 border-green-300',
    'bg-purple-100 border-purple-300',
  ];

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-primary" />
          Personal Notes ({notes.length}/{MAX_NOTES})
        </h3>
        {notes.length < MAX_NOTES && !showAdd && (
          <Button variant="retro" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Fun facts, quirks, or things you want matches to know
      </p>

      {/* Add New Note */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write something fun about yourself..."
              className="border-2 border-foreground resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="hero"
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAdd(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Notes - Sticky Note Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {notes.map((note, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: idx % 2 === 0 ? -1 : 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`relative p-4 rounded-lg border-2 shadow-md ${noteColors[idx % noteColors.length]}`}
            >
              <button
                onClick={() => handleRemoveNote(idx)}
                className="absolute top-2 right-2 text-foreground/50 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-sm text-foreground pr-6 font-medium" style={{ fontFamily: 'cursive' }}>
                {note}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {notes.length === 0 && !showAdd && (
        <div className="text-center py-6 text-muted-foreground">
          <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notes yet. Add some personality!</p>
        </div>
      )}
    </div>
  );
};

export default PersonalNotesEditor;
