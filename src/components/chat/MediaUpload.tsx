import { useRef, useState } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  matchId: string;
  profileId: string;
  onUpload: (url: string, type: 'image' | 'video') => void;
}

const MediaUpload = ({ matchId, profileId, onUpload }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum size is ${isVideo ? '50MB' : '10MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${matchId}/${profileId}-${Date.now()}.${fileExt}`;

      // Check if bucket exists, if not use profile-photos as fallback
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(`chat-media/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(`chat-media/${fileName}`);

      const mediaType = isImage ? 'image' : 'video';
      setPreview({ url: urlData.publicUrl, type: mediaType });
      onUpload(urlData.publicUrl, mediaType);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Image className="w-5 h-5" />
        )}
      </Button>

      {preview && (
        <div className="absolute bottom-12 left-0 bg-card rounded-lg border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-2 z-50">
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center border-2 border-foreground"
          >
            <X className="w-3 h-3" />
          </button>
          {preview.type === 'image' ? (
            <img src={preview.url} alt="Preview" className="w-24 h-24 object-cover rounded" />
          ) : (
            <video src={preview.url} className="w-24 h-24 object-cover rounded" controls />
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
