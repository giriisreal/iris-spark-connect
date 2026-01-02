import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const usePhotoUpload = (profileId: string | undefined) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (!user || !profileId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload photos',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Save to profile_photos table
      const { error: dbError } = await supabase
        .from('profile_photos')
        .insert({
          profile_id: profileId,
          photo_url: publicUrl,
          is_primary: false,
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Photo uploaded!',
        description: 'Your photo has been added to your profile',
      });

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, profileId, toast]);

  const deletePhoto = useCallback(async (photoId: string, photoUrl: string) => {
    if (!user) return false;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage
        .from('profile-photos')
        .remove([filePath]);

      // Delete from database
      await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      toast({
        title: 'Photo deleted',
        description: 'Your photo has been removed',
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return { uploadPhoto, deletePhoto, uploading };
};
