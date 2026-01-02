import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, Loader2, MoreVertical, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface OtherProfile {
  id: string;
  name: string;
  age: number;
  photos: { photo_url: string; is_primary: boolean }[];
}

const Chat = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { messages, loading, sendMessage, markAsRead } = useChat(matchId || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
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
          .select('id, name, age')
          .eq('id', otherProfileId)
          .single();

        const { data: photos } = await supabase
          .from('profile_photos')
          .select('photo_url, is_primary')
          .eq('profile_id', otherProfileId);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await sendMessage(newMessage);
    
    if (!error) {
      setNewMessage('');
    } else {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
    setSending(false);
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
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <nav className="p-4 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {otherProfile && (
          <div className="flex items-center gap-3 flex-1">
            {primaryPhoto ? (
              <img 
                src={primaryPhoto.photo_url}
                alt={otherProfile.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-foreground">{otherProfile.name}</h1>
              <p className="text-xs text-muted-foreground">{otherProfile.age} years old</p>
            </div>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Say hello to {otherProfile?.name}! 👋
            </p>
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn 
                      ? 'bg-gradient-primary text-primary-foreground rounded-br-md' 
                      : 'bg-card shadow-soft text-foreground rounded-bl-md'
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

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
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
    </div>
  );
};

export default Chat;
