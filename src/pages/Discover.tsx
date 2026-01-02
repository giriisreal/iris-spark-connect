import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, ProfilePhoto } from '@/hooks/useProfile';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, X, Sparkles, MapPin, User, MessageCircle, LogOut, Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserProfileView from '@/components/UserProfileView';
import logo from '@/assets/logo.png';

interface DiscoverProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  city: string | null;
  interests: string[];
  location_lat: number | null;
  location_lng: number | null;
  photos: ProfilePhoto[];
  compatibilityScore?: number;
  icebreaker?: string;
  distance?: number;
}

const SWIPE_THRESHOLD = 100;

const Discover = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { location, requestLocation, calculateDistance } = useLocation();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dragX, setDragX] = useState(0);
  const constraintsRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!profileLoading && !profile) {
      navigate('/onboarding');
    }
  }, [user, profile, profileLoading, navigate]);

  // Request location on mount
  useEffect(() => {
    if (profile && !profile.location_lat) {
      requestLocation().then((loc) => {
        if (loc && profile) {
          updateProfile({
            location_lat: loc.lat,
            location_lng: loc.lng,
          });
        }
      });
    }
  }, [profile]);

  const fetchProfiles = useCallback(async () => {
    if (!profile) return;

    setLoadingProfiles(true);
    
    let query = supabase
      .from('profiles')
      .select('id, name, age, bio, city, interests, location_lat, location_lng')
      .neq('id', profile.id);

    if (profile.looking_for && profile.looking_for.length > 0) {
      query = query.in('gender', profile.looking_for);
    }

    if (profile.min_age) {
      query = query.gte('age', profile.min_age);
    }
    if (profile.max_age) {
      query = query.lte('age', profile.max_age);
    }

    const { data: swipedData } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', profile.id);

    const swipedIds = swipedData?.map(s => s.swiped_id) || [];

    const { data } = await query.limit(50);

    if (data) {
      let filteredProfiles = data
        .filter(p => !swipedIds.includes(p.id))
        .map(p => {
          let distance: number | undefined;
          if (profile.location_lat && profile.location_lng && p.location_lat && p.location_lng) {
            distance = calculateDistance(
              profile.location_lat,
              profile.location_lng,
              p.location_lat,
              p.location_lng
            );
          }
          return { ...p, photos: [] as ProfilePhoto[], distance };
        });

      if (profile.max_distance && profile.location_lat) {
        filteredProfiles = filteredProfiles.filter(p => 
          !p.distance || p.distance <= (profile.max_distance || 50)
        );
      }

      const profilesWithPhotos = await Promise.all(
        filteredProfiles.map(async (p) => {
          const { data: photos } = await supabase
            .from('profile_photos')
            .select('*')
            .eq('profile_id', p.id)
            .order('order_index');
          return { ...p, photos: photos || [] };
        })
      );

      setProfiles(profilesWithPhotos as DiscoverProfile[]);
    }
    setLoadingProfiles(false);
  }, [profile, calculateDistance]);

  useEffect(() => {
    if (profile) {
      fetchProfiles();
    }
  }, [profile, fetchProfiles]);

  // Fetch AI compatibility score for current profile
  useEffect(() => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile && profile && !currentProfile.compatibilityScore) {
      setLoadingCompatibility(true);
      supabase.functions.invoke('compatibility-score', {
        body: {
          userProfile: profile,
          targetProfile: currentProfile,
        },
      }).then(({ data, error }) => {
        if (!error && data) {
          setProfiles(prev => prev.map((p, i) => 
            i === currentIndex 
              ? { ...p, compatibilityScore: data.score, icebreaker: data.icebreaker }
              : p
          ));
        }
        setLoadingCompatibility(false);
      });
    }
  }, [currentIndex, profiles, profile]);

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    if (!profile || currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    setSwipeDirection(direction === 'like' ? 'right' : 'left');

    const { error } = await supabase.from('swipes').insert({
      swiper_id: profile.id,
      swiped_id: swipedProfile.id,
      direction: direction,
    });

    if (!error && direction === 'like') {
      const { data: matchData } = await supabase
        .from('matches')
        .select('id')
        .or(`and(profile1_id.eq.${profile.id},profile2_id.eq.${swipedProfile.id}),and(profile1_id.eq.${swipedProfile.id},profile2_id.eq.${profile.id})`)
        .maybeSingle();

      if (matchData) {
        toast({
          title: "It's a Match! 💚",
          description: `You and ${swipedProfile.name} liked each other!`,
        });
      }
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      setDragX(0);
    }, 400);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      handleSwipe('like');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handleSwipe('dislike');
    } else {
      setDragX(0);
    }
  };

  const currentProfile = profiles[currentIndex];
  const primaryPhoto = currentProfile?.photos?.find(p => p.is_primary) || currentProfile?.photos?.[0];

  // Determine swipe indicator
  const showLikeIndicator = dragX > 50;
  const showDislikeIndicator = dragX < -50;

  if (profileLoading || loadingProfiles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Finding matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" ref={constraintsRef}>
      {/* Header */}
      <nav className="p-4 flex items-center justify-between border-b-2 border-foreground bg-card">
        <div className="flex items-center gap-2">
          <img src={logo} alt="IRIS" className="w-8 h-8 object-contain" />
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
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: swipeDirection === 'left' ? -400 : swipeDirection === 'right' ? 400 : 0,
                  rotate: swipeDirection === 'left' ? -30 : swipeDirection === 'right' ? 30 : dragX / 20,
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: swipeDirection ? 0.4 : 0.1 }}
                className="relative bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden aspect-[3/4] cursor-grab active:cursor-grabbing select-none"
              >
                {/* Swipe Indicators */}
                <AnimatePresence>
                  {showLikeIndicator && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-8 left-8 z-20 px-6 py-3 rounded-xl bg-success border-4 border-card text-card text-2xl font-bold rotate-[-20deg]"
                    >
                      LIKE 💚
                    </motion.div>
                  )}
                  {showDislikeIndicator && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-8 right-8 z-20 px-6 py-3 rounded-xl bg-destructive border-4 border-card text-card text-2xl font-bold rotate-[20deg]"
                    >
                      NOPE ✕
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profile Image */}
                {primaryPhoto ? (
                  <img 
                    src={primaryPhoto.photo_url} 
                    alt={currentProfile.name}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent pointer-events-none" />
                
                {/* Compatibility Score Badge */}
                {currentProfile.compatibilityScore && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-primary border-2 border-foreground text-primary-foreground text-sm font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
                  >
                    <Sparkles className="w-4 h-4" />
                    {currentProfile.compatibilityScore}% Match
                  </motion.div>
                )}

                {loadingCompatibility && (
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-card border-2 border-foreground text-foreground text-sm font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </div>
                )}

                {/* View Profile Button */}
                <button
                  onClick={() => setShowProfile(true)}
                  className="absolute top-4 left-4 px-3 py-2 rounded-xl bg-card/90 border-2 border-foreground text-foreground text-sm font-medium flex items-center gap-1 shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                  <h2 className="text-3xl font-bold text-card mb-1">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <div className="flex items-center gap-3 text-card/80 text-sm mb-3">
                    {currentProfile.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {currentProfile.city}
                      </span>
                    )}
                    {currentProfile.distance !== undefined && (
                      <span className="flex items-center gap-1">
                        • {currentProfile.distance} miles away
                      </span>
                    )}
                  </div>
                  {currentProfile.bio && (
                    <p className="text-card/70 text-sm line-clamp-2 mb-3">{currentProfile.bio}</p>
                  )}
                  
                  {currentProfile.icebreaker && (
                    <div className="bg-card/20 rounded-xl p-3 mb-3 border border-card/30">
                      <p className="text-card/90 text-xs">
                        💡 <span className="font-medium">Say:</span> "{currentProfile.icebreaker}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {currentProfile.interests.slice(0, 4).map((interest) => (
                      <span key={interest} className="px-2 py-1 rounded-full bg-card/20 text-card text-xs border border-card/30">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-8">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No more profiles</h3>
                <p className="text-muted-foreground mb-4">Check back later for more matches!</p>
                <Button variant="hero" onClick={fetchProfiles}>
                  Refresh
                </Button>
              </div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {currentProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-8 mt-8"
            >
              <Button
                variant="dislike"
                size="iconXl"
                onClick={() => handleSwipe('dislike')}
              >
                <X className="w-8 h-8" />
              </Button>
              <Button
                variant="like"
                size="iconXl"
                onClick={() => handleSwipe('like')}
              >
                <Heart className="w-8 h-8" fill="currentColor" />
              </Button>
            </motion.div>
          )}
          
          {/* Swipe hint */}
          {currentProfile && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              ← Swipe left to pass • Swipe right to like →
            </p>
          )}
        </div>
      </div>

      {/* Full Profile View Modal */}
      <AnimatePresence>
        {showProfile && currentProfile && (
          <UserProfileView
            profile={currentProfile}
            onClose={() => setShowProfile(false)}
            onLike={() => {
              setShowProfile(false);
              handleSwipe('like');
            }}
            onDislike={() => {
              setShowProfile(false);
              handleSwipe('dislike');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
