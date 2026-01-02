import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, X, Sparkles, MapPin, User, MessageCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoverProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  city: string | null;
  interests: string[];
}

const Discover = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!profileLoading && !profile) {
      navigate('/onboarding');
    }
  }, [user, profile, profileLoading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchProfiles();
    }
  }, [profile]);

  const fetchProfiles = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, name, age, bio, city, interests')
      .neq('id', profile.id)
      .limit(20);

    if (data) {
      setProfiles(data as DiscoverProfile[]);
    }
  };

  const handleSwipe = async (swipeDirection: 'like' | 'dislike') => {
    if (!profile || currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    setDirection(swipeDirection === 'like' ? 'right' : 'left');

    const { error } = await supabase.from('swipes').insert({
      swiper_id: profile.id,
      swiped_id: swipedProfile.id,
      direction: swipeDirection,
    });

    if (!error && swipeDirection === 'like') {
      // Check for match
      const { data: matchData } = await supabase
        .from('matches')
        .select('id')
        .or(`profile1_id.eq.${profile.id},profile2_id.eq.${profile.id}`)
        .or(`profile1_id.eq.${swipedProfile.id},profile2_id.eq.${swipedProfile.id}`)
        .maybeSingle();

      if (matchData) {
        toast({
          title: "It's a Match! 💚",
          description: `You and ${swipedProfile.name} liked each other!`,
        });
      }
    }

    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const currentProfile = profiles[currentIndex];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <nav className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-foreground">IRIS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/matches')}>
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <User className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {currentProfile ? (
              <motion.div
                key={currentProfile.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
                  rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0,
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative bg-card rounded-3xl shadow-elevated overflow-hidden aspect-[3/4]"
              >
                {/* Profile Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="w-24 h-24 text-muted-foreground/50" />
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl font-bold text-card mb-1">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.city && (
                    <p className="text-card/80 flex items-center gap-1 mb-3">
                      <MapPin className="w-4 h-4" />
                      {currentProfile.city}
                    </p>
                  )}
                  {currentProfile.bio && (
                    <p className="text-card/70 text-sm line-clamp-2 mb-3">{currentProfile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {currentProfile.interests.slice(0, 4).map((interest) => (
                      <span key={interest} className="px-2 py-1 rounded-full bg-card/20 text-card text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No more profiles</h3>
                <p className="text-muted-foreground">Check back later for more matches!</p>
              </div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {currentProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6 mt-8"
            >
              <Button
                variant="dislike"
                size="iconXl"
                className="rounded-full"
                onClick={() => handleSwipe('dislike')}
              >
                <X className="w-8 h-8" />
              </Button>
              <Button
                variant="like"
                size="iconXl"
                className="rounded-full"
                onClick={() => handleSwipe('like')}
              >
                <Heart className="w-8 h-8" fill="currentColor" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
