import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export const useChat = (matchId: string) => {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as Message[]);
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('New message:', payload);
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!profile || !matchId || !content.trim()) return { error: new Error('Invalid params') };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: profile.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
    }

    return { data, error };
  }, [profile, matchId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!profile || !matchId) return;

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', profile.id)
      .is('read_at', null);
  }, [profile, matchId]);

  return { messages, loading, sendMessage, markAsRead };
};
