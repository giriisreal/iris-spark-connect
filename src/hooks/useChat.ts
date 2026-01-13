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
  media_url?: string | null;
  media_type?: string | null;
  reply_to_id?: string | null;
  reply_to?: {
    content: string;
    sender_id: string;
  } | null;
}

interface Reaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

export const useChat = (matchId: string) => {
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
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
      // Fetch reply references for messages that have reply_to_id
      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('messages')
              .select('content, sender_id')
              .eq('id', msg.reply_to_id)
              .single();
            return { ...msg, reply_to: replyData };
          }
          return { ...msg, reply_to: null };
        })
      );
      setMessages(messagesWithReplies as Message[]);
    }
    setLoading(false);
  }, [matchId]);

  // Fetch reactions
  const fetchReactions = useCallback(async () => {
    if (!matchId) return;

    const { data: messageIds } = await supabase
      .from('messages')
      .select('id')
      .eq('match_id', matchId);

    if (messageIds && messageIds.length > 0) {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds.map(m => m.id));

      if (!error && data) {
        setReactions(data as Reaction[]);
      }
    }
  }, [matchId]);

  useEffect(() => {
    fetchMessages();
    fetchReactions();
  }, [fetchMessages, fetchReactions]);

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
        async (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new as Message;
          
          // Fetch reply reference if exists
          if (newMsg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('messages')
              .select('content, sender_id')
              .eq('id', newMsg.reply_to_id)
              .single();
            newMsg.reply_to = replyData;
          }
          
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Subscribe to reactions
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`reactions-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchReactions]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    options?: { 
      replyToId?: string; 
      mediaUrl?: string; 
      mediaType?: string;
    }
  ) => {
    if (!profile || !matchId) return { error: new Error('Invalid params') };
    if (!content.trim() && !options?.mediaUrl) return { error: new Error('Empty message') };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: profile.id,
        content: content.trim(),
        reply_to_id: options?.replyToId || null,
        media_url: options?.mediaUrl || null,
        media_type: options?.mediaType || null,
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

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        profile_id: profile.id,
        emoji,
      });

    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [profile]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('profile_id', profile.id)
      .eq('emoji', emoji);

    if (error) {
      console.error('Error removing reaction:', error);
    }
  }, [profile]);

  // Get reactions for a message grouped by emoji
  const getMessageReactions = useCallback((messageId: string) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    const grouped: { [emoji: string]: { count: number; hasReacted: boolean } } = {};
    
    messageReactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, hasReacted: false };
      }
      grouped[r.emoji].count++;
      if (r.profile_id === profile?.id) {
        grouped[r.emoji].hasReacted = true;
      }
    });

    return Object.entries(grouped).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  }, [reactions, profile]);

  return { 
    messages, 
    loading, 
    sendMessage, 
    markAsRead,
    addReaction,
    removeReaction,
    getMessageReactions,
  };
};
