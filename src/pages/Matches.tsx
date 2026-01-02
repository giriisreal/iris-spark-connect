import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Matches = () => {
  const { user } = useAuth();
  const { matches, loading } = useMatches();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="p-4 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Matches</h1>
      </nav>
      
      <div className="p-4 max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-6">Keep swiping to find your match!</p>
            <Button variant="hero" onClick={() => navigate('/discover')}>
              <Heart className="w-5 h-5" /> Start Swiping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, index) => {
              const otherProfile = match.otherProfile;
              if (!otherProfile) return null;
              
              const primaryPhoto = otherProfile.photos?.find(p => p.is_primary) || otherProfile.photos?.[0];
              
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="bg-card rounded-2xl p-4 shadow-soft cursor-pointer hover:shadow-medium transition-all flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {primaryPhoto ? (
                      <img 
                        src={primaryPhoto.photo_url}
                        alt={otherProfile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                    )}
                    {match.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-semibold">
                        {match.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">
                        {otherProfile.name}, {otherProfile.age}
                      </h3>
                      {match.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(match.lastMessage.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {match.lastMessage ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {match.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-primary font-medium">
                        Start a conversation! 👋
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
