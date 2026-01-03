import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Sparkles, Loader2, Check, X, User, MapPin, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  city: string | null;
  gender: string;
  interests: string[] | null;
  vibe_status: string | null;
  photoUrl: string | null;
  score: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  profiles?: MatchProfile[];
  timestamp: Date;
}

const IrisAI = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm IRIS, your AI matchmaking assistant. Tell me what you're looking for, like:\n\n\"Find me a creative woman under 28 in Mumbai\"\n\"Show me guys who love hiking and are into tech\"\n\"I want someone artistic in Bangalore\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('iris-ai', {
        body: { message: input.trim(), userId: user.id }
      });

      if (error) {
        console.error('IRIS AI error:', error);
        throw new Error(error.message || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "Here's what I found for you!",
        profiles: data.profiles || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('IRIS error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to search profiles',
        variant: 'destructive'
      });
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't complete that search. Please try again!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (profileId: string) => {
    if (!profile) return;

    try {
      // Check if already swiped
      const { data: existing } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', profile.id)
        .eq('swiped_id', profileId)
        .single();

      if (existing) {
        toast({ title: 'Already swiped', description: 'You have already liked this profile' });
        return;
      }

      // Create swipe
      await supabase.from('swipes').insert({
        swiper_id: profile.id,
        swiped_id: profileId,
        direction: 'right'
      });

      // Check for mutual match
      const { data: mutualSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', profileId)
        .eq('swiped_id', profile.id)
        .eq('direction', 'right')
        .single();

      if (mutualSwipe) {
        // Create match
        await supabase.from('matches').insert({
          profile1_id: profile.id,
          profile2_id: profileId
        });

        toast({
          title: '🎉 It\'s a Match!',
          description: 'You both liked each other! Start chatting now.',
        });
      } else {
        toast({ title: 'Liked!', description: 'Profile liked successfully' });
      }
    } catch (err) {
      console.error('Like error:', err);
      toast({ title: 'Error', description: 'Failed to like profile', variant: 'destructive' });
    }
  };

  const handlePass = async (profileId: string) => {
    if (!profile) return;

    try {
      await supabase.from('swipes').insert({
        swiper_id: profile.id,
        swiped_id: profileId,
        direction: 'left'
      });
      toast({ title: 'Passed', description: 'Profile skipped' });
    } catch (err) {
      console.error('Pass error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="p-4 flex items-center gap-4 border-b-2 border-foreground bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-foreground">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">IRIS AI</h1>
            <p className="text-xs text-muted-foreground">Your AI Matchmaker</p>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? '' : ''}`}>
              <div
                className={`rounded-xl px-4 py-3 border-2 border-foreground ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                    : 'bg-card text-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Profile Cards */}
              {message.profiles && message.profiles.length > 0 && (
                <div className="mt-3 space-y-3">
                  {message.profiles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card border-2 border-foreground rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
                    >
                      <div className="flex">
                        {/* Photo */}
                        <div className="w-24 h-28 flex-shrink-0 bg-muted">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-foreground">{p.name}, {p.age}</h3>
                            {p.vibe_status && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                                {p.vibe_status}
                              </span>
                            )}
                          </div>
                          
                          {p.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              {p.city}
                            </div>
                          )}

                          {p.interests && p.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {p.interests.slice(0, 3).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-foreground"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex border-t-2 border-foreground">
                        <button
                          onClick={() => handlePass(p.id)}
                          className="flex-1 py-2 flex items-center justify-center gap-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-r border-foreground"
                        >
                          <X className="w-4 h-4" />
                          Pass
                        </button>
                        <button
                          onClick={() => handleLike(p.id)}
                          className="flex-1 py-2 flex items-center justify-center gap-2 text-sm text-success hover:bg-success/10 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          Like
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {message.profiles && message.profiles.length === 0 && message.role === 'assistant' && message.id !== 'welcome' && (
                <div className="mt-3 p-4 bg-muted rounded-xl border-2 border-foreground text-center">
                  <p className="text-sm text-muted-foreground">No profiles found matching your criteria. Try broadening your search!</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-card border-2 border-foreground rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Searching for matches...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t-2 border-foreground bg-card">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe who you're looking for..."
            className="flex-1 border-2 border-foreground"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="hero"
            size="icon"
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Try: "Find me someone creative in their 20s who loves music"
        </p>
      </form>
    </div>
  );
};

export default IrisAI;