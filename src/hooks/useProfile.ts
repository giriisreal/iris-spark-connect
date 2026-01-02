import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: string;
  bio: string | null;
  location_lat: number | null;
  location_lng: number | null;
  city: string | null;
  looking_for: string[];
  min_age: number;
  max_age: number;
  max_distance: number;
  interests: string[];
  created_at: string;
  updated_at: string;
  vibe_status: string | null;
  dating_mode: string | null;
  pronouns: string | null;
  voice_intro_url: string | null;
  energy_preferences: any;
  non_negotiables: string[] | null;
  boundaries: string[] | null;
  comfort_tags: string[] | null;
  profile_theme: string | null;
  hide_photos_until_message: number | null;
  break_mode_until: string | null;
  session_start_time: string | null;
  daily_usage_minutes: number | null;
  social_links: any;
  pickup_lines: string[] | null;
  personal_notes: string[] | null;
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  photo_url: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setPhotos([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (profileData) {
      setProfile(profileData as unknown as Profile);
      
      const { data: photosData } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('order_index');
      
      if (photosData) {
        setPhotos(photosData as ProfilePhoto[]);
      }
    }
    setLoading(false);
  };

  const createProfile = async (profileData: Omit<Partial<Profile>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { name: string; age: number; gender: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        user_id: user.id,
        name: profileData.name,
        age: profileData.age,
        gender: profileData.gender,
        bio: profileData.bio,
        city: profileData.city,
        interests: profileData.interests,
        looking_for: profileData.looking_for,
      }])
      .select()
      .single();

    if (data) {
      setProfile(data as unknown as Profile);
    }

    return { data, error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error('No profile') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (data) {
      setProfile(data as unknown as Profile);
    }

    return { data, error };
  };

  return { profile, photos, loading, fetchProfile, createProfile, updateProfile };
};
