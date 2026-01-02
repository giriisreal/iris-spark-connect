import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, ProfilePhoto } from './useProfile';

interface Match {
  id: string;
  profile1_id: string;
  profile2_id: string;
  created_at: string;
  otherProfile?: {
    id: string;
    name: string;
    age: number;
    bio: string | null;
    city: string | null;
    photos: ProfilePhoto[];
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

export const useMatches = () => {
  const { profile } = useProfile();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    
    // Get all matches
    const { data: matchesData, error } = await supabase
      .from('matches')
      .select('*')
      .or(`profile1_id.eq.${profile.id},profile2_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
      return;
    }

    // For each match, get the other profile and last message
    const enrichedMatches = await Promise.all(
      (matchesData || []).map(async (match) => {
        const otherProfileId = match.profile1_id === profile.id 
          ? match.profile2_id 
          : match.profile1_id;

        // Get other profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('id, name, age, bio, city')
          .eq('id', otherProfileId)
          .single();

        // Get photos
        const { data: photos } = await supabase
          .from('profile_photos')
          .select('*')
          .eq('profile_id', otherProfileId)
          .order('order_index');

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .neq('sender_id', profile.id)
          .is('read_at', null);

        return {
          ...match,
          otherProfile: otherProfile ? {
            ...otherProfile,
            photos: photos || [],
          } : undefined,
          lastMessage: messages?.[0] || undefined,
          unreadCount: count || 0,
        };
      })
    );

    setMatches(enrichedMatches as Match[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Subscribe to new matches
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('matches-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchMatches]);

  return { matches, loading, refetch: fetchMatches };
};
