import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Clock, User, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface SwipeRecord {
  id: string;
  direction: string;
  created_at: string;
  swiped_profile: {
    id: string;
    name: string;
    age: number;
    city: string | null;
    primary_photo?: string;
  };
}

const SwipeHistory = () => {
  const { profile } = useProfile();
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'likes' | 'passes'>('all');

  useEffect(() => {
    const fetchSwipes = async () => {
      if (!profile?.id) return;
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from('swipes')
        .select(`
          id,
          direction,
          created_at,
          swiped_id
        `)
        .eq('swiper_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        // Fetch profile details for each swiped user
        const swipedIds = data.map(s => s.swiped_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, age, city')
          .in('id', swipedIds);

        const { data: photos } = await supabase
          .from('profile_photos')
          .select('profile_id, photo_url')
          .in('profile_id', swipedIds)
          .eq('is_primary', true);

        const swipesWithProfiles: SwipeRecord[] = data.map(swipe => {
          const profileData = profiles?.find(p => p.id === swipe.swiped_id);
          const photoData = photos?.find(p => p.profile_id === swipe.swiped_id);
          
          return {
            id: swipe.id,
            direction: swipe.direction,
            created_at: swipe.created_at,
            swiped_profile: {
              id: swipe.swiped_id,
              name: profileData?.name || 'Unknown',
              age: profileData?.age || 0,
              city: profileData?.city || null,
              primary_photo: photoData?.photo_url,
            },
          };
        });

        setSwipes(swipesWithProfiles);
      }
      
      setLoading(false);
    };

    fetchSwipes();
  }, [profile?.id]);

  const filteredSwipes = swipes.filter(swipe => {
    if (filter === 'likes') return swipe.direction === 'like';
    if (filter === 'passes') return swipe.direction === 'dislike';
    return true;
  });

  const likesCount = swipes.filter(s => s.direction === 'like').length;
  const passesCount = swipes.filter(s => s.direction === 'dislike').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Swipe History</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {likesCount} likes • {passesCount} passes
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Filter Tabs */}
            <div className="px-4 pb-3 flex gap-2">
              {(['all', 'likes', 'passes'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={filter === tab ? 'hero' : 'retro'}
                  size="sm"
                  onClick={() => setFilter(tab)}
                  className="capitalize"
                >
                  {tab === 'likes' && <Heart className="w-3 h-3 mr-1" fill="currentColor" />}
                  {tab === 'passes' && <X className="w-3 h-3 mr-1" />}
                  {tab}
                </Button>
              ))}
            </div>

            {/* Swipe List */}
            <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredSwipes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No swipes yet
                </p>
              ) : (
                filteredSwipes.map((swipe) => (
                  <motion.div
                    key={swipe.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    {swipe.swiped_profile.primary_photo ? (
                      <img
                        src={swipe.swiped_profile.primary_photo}
                        alt={swipe.swiped_profile.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-foreground"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-foreground">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {swipe.swiped_profile.name}, {swipe.swiped_profile.age}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(swipe.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      swipe.direction === 'like' 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-destructive text-destructive-foreground'
                    }`}>
                      {swipe.direction === 'like' ? (
                        <Heart className="w-4 h-4" fill="currentColor" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SwipeHistory;
