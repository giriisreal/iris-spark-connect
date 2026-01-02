import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Plus, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DailyUpdate {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

const DailyUpdatesEditor = () => {
  const { profile, fetchProfile } = useProfile();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch daily updates
  const fetchUpdates = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('daily_updates')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setUpdates(data || []);
    setLoading(false);
  };

  useState(() => {
    fetchUpdates();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowAdd(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.id) return;
    
    setUploading(true);
    
    // Upload to storage
    const fileExt = selectedFile.name.split('.').pop();
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, selectedFile);
    
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);
    
    // Save to database
    const { error } = await supabase.from('daily_updates').insert({
      profile_id: profile.id,
      photo_url: publicUrl,
      caption: caption.trim() || null,
    });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Daily update posted! 🎉' });
      setShowAdd(false);
      setCaption('');
      setPreviewUrl(null);
      setSelectedFile(null);
      fetchUpdates();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('daily_updates').delete().eq('id', id);
    if (!error) {
      setUpdates(prev => prev.filter(u => u.id !== id));
      toast({ title: 'Update deleted' });
    }
  };

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span className="text-lg">📸</span> Daily Updates
        </h3>
        <Button
          variant="retro"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Share moments that expire in 24 hours
      </p>

      {/* Add New Update Modal */}
      <AnimatePresence>
        {showAdd && previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3 p-4 rounded-xl border-2 border-dashed border-primary bg-primary/5"
          >
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full aspect-video object-cover rounded-lg border-2 border-foreground"
              />
              <button
                onClick={() => {
                  setShowAdd(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card border-2 border-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <Textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border-2 border-foreground resize-none"
              rows={2}
            />
            
            <Button
              variant="hero"
              className="w-full"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Post Update
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Updates */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : updates.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {updates.map((update) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <img
                src={update.photo_url}
                alt="Daily update"
                className="w-full aspect-square object-cover rounded-lg border-2 border-foreground"
              />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
                {update.caption && (
                  <p className="text-card text-xs text-center mb-2 line-clamp-2">{update.caption}</p>
                )}
                <div className="flex items-center gap-1 text-card/80 text-xs mb-2">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(update.expires_at), { addSuffix: true })}
                </div>
                <button
                  onClick={() => handleDelete(update.id)}
                  className="text-destructive text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No daily updates yet</p>
        </div>
      )}
    </div>
  );
};

export default DailyUpdatesEditor;
