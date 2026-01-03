import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User, ArrowLeft, Loader2, Sparkles, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import logo from '@/assets/logo.png';

const Matches = () => {
  const { user } = useAuth();
  const { matches, loading } = useMatches();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <nav className="p-4 flex items-center justify-between border-b-2 border-primary/20 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/discover')}
            className="rounded-xl hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <h1 className="text-xl font-bold text-foreground">Your Matches</h1>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="IRIS" className="w-12 h-12 rounded-xl" />
        </Link>
      </nav>
      
      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <p className="text-muted-foreground">Loading your matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matches yet</h3>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Keep swiping to find your perfect match! Great connections are just around the corner.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate('/discover')}>
              <Heart className="w-5 h-5" /> Start Swiping
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Match count header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-semibold text-foreground">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
            </motion.div>

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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="bg-card rounded-2xl p-4 border-2 border-primary/10 hover:border-primary/30 shadow-soft cursor-pointer hover:shadow-medium transition-all flex items-center gap-4 group"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {primaryPhoto ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <img 
                          src={primaryPhoto.photo_url}
                          alt={otherProfile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                    )}
                    {match.unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold shadow-md"
                      >
                        {match.unreadCount}
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {otherProfile.name}, {otherProfile.age}
                      </h3>
                      {match.lastMessage && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {formatDistanceToNow(new Date(match.lastMessage.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {match.lastMessage ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {match.lastMessage.content}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-secondary" />
                        <p className="text-sm text-secondary font-medium">
                          Start a conversation! 👋
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Chat arrow */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom navigation hint */}
      {matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2"
        >
          <Button
            variant="heroSecondary"
            size="lg"
            onClick={() => navigate('/discover')}
            className="shadow-elevated"
          >
            <Heart className="w-5 h-5" /> Find More Matches
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Matches;
