import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, Loader2, MoreVertical, Ban, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import UserProfileView from '@/components/UserProfileView';

interface OtherProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  city: string | null;
  interests: string[];
  photos: { id: string; photo_url: string; is_primary: boolean | null; order_index: number | null; profile_id: string; created_at: string }[];
}

const Chat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { messages, loading, sendMessage, markAsRead } = useChat(matchId || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // Fetch match and other profile
  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId || !profile) return;

      const { data: match } = await supabase
        .from('matches')
        .select('profile1_id, profile2_id')
        .eq('id', matchId)
        .single();

      if (match) {
        const otherProfileId = match.profile1_id === profile.id 
          ? match.profile2_id 
          : match.profile1_id;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, age, bio, city, interests')
          .eq('id', otherProfileId)
          .single();

        const { data: photos } = await supabase
          .from('profile_photos')
          .select('*')
          .eq('profile_id', otherProfileId)
          .order('order_index');

        if (profileData) {
          setOtherProfile({
            ...profileData,
            photos: photos || [],
          });
        }
      }
    };

    fetchMatch();
  }, [matchId, profile]);

  // Mark messages as read when chat opens
  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSuggestions = async () => {
    if (!otherProfile) return;
    
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          type: 'message_suggestions',
          context: {
            matchName: otherProfile.name,
            interests: otherProfile.interests,
            bio: otherProfile.bio,
          },
          messages: messages.slice(-5).map(m => ({
            role: m.sender_id === profile?.id ? 'user' : 'assistant',
            content: m.content,
          })),
        },
      });

      if (!error && data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
    setLoadingSuggestions(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await sendMessage(newMessage);
    
    if (!error) {
      setNewMessage('');
      setSuggestions([]);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
    setSending(false);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
    setSuggestions([]);
  };

  const handleBlock = async () => {
    if (!profile || !otherProfile) return;

    await supabase.from('blocked_users').insert({
      blocker_id: profile.id,
      blocked_id: otherProfile.id,
    });

    toast({
      title: 'User blocked',
      description: `You have blocked ${otherProfile.name}`,
    });

    navigate('/matches');
  };

  const primaryPhoto = otherProfile?.photos?.find(p => p.is_primary) || otherProfile?.photos?.[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="p-4 flex items-center gap-4 border-b-2 border-foreground bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {otherProfile && (
          <button 
            className="flex items-center gap-3 flex-1"
            onClick={() => setShowProfile(true)}
          >
            {primaryPhoto ? (
              <img 
                src={primaryPhoto.photo_url}
                alt={otherProfile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-foreground"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-foreground">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="text-left">
              <h1 className="font-bold text-foreground">{otherProfile.name}</h1>
              <p className="text-xs text-muted-foreground">{otherProfile.age} years old • Tap to view</p>
            </div>
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-2 border-foreground">
            <DropdownMenuItem onClick={handleBlock} className="text-destructive">
              <Ban className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 max-w-sm mx-auto">
            <span className="text-4xl mb-4 block">👋</span>
            <p className="text-foreground font-bold mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Say hello to {otherProfile?.name}!
            </p>
            <Button variant="hero" size="sm" onClick={fetchSuggestions} disabled={loadingSuggestions}>
              {loadingSuggestions ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Get AI Suggestions
            </Button>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender_id === profile?.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-xl px-4 py-2 border-2 border-foreground ${
                    isOwn 
                      ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]' 
                      : 'bg-card text-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    {isOwn && message.read_at && ' • Read'}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Suggestions
              </span>
              <button onClick={() => setSuggestions([])} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="px-3 py-2 rounded-lg bg-card border-2 border-primary text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t-2 border-foreground bg-card">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={fetchSuggestions}
            disabled={loadingSuggestions}
            title="Get AI suggestions"
          >
            {loadingSuggestions ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-2 border-foreground"
            disabled={sending}
          />
          <Button 
            type="submit" 
            variant="hero" 
            size="icon"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Profile View Modal */}
      <AnimatePresence>
        {showProfile && otherProfile && (
          <UserProfileView
            profile={{
              ...otherProfile,
              interests: otherProfile.interests || [],
            }}
            onClose={() => setShowProfile(false)}
            showActions={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
