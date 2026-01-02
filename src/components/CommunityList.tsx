import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Users, Check, Plus } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  member_count: number;
}

const CommunityList = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, [profile]);

  const fetchCommunities = async () => {
    const { data: communitiesData } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });

    if (communitiesData) {
      setCommunities(communitiesData);
    }

    if (profile) {
      const { data: memberData } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('profile_id', profile.id);

      if (memberData) {
        setJoinedCommunities(memberData.map(m => m.community_id));
      }
    }
    setLoading(false);
  };

  const toggleCommunity = async (communityId: string) => {
    if (!profile) return;

    const isJoined = joinedCommunities.includes(communityId);

    if (isJoined) {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('profile_id', profile.id);

      setJoinedCommunities(prev => prev.filter(id => id !== communityId));
      toast({ title: "Left community" });
    } else {
      await supabase
        .from('community_members')
        .insert({ community_id: communityId, profile_id: profile.id });

      setJoinedCommunities(prev => [...prev, communityId]);
      toast({ title: "Joined community! 🎉" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Find Your Tribe
      </h3>
      <p className="text-sm text-muted-foreground">
        Join communities to match with people who share your passions
      </p>
      <div className="grid gap-3">
        {communities.map((community, idx) => {
          const isJoined = joinedCommunities.includes(community.id);
          return (
            <motion.button
              key={community.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => toggleCommunity(community.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                isJoined
                  ? 'border-primary bg-primary/10 shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                  : 'border-border hover:border-foreground bg-card'
              }`}
            >
              <span className="text-3xl">{community.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold">{community.name}</h4>
                <p className="text-sm text-muted-foreground">{community.description}</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                isJoined 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground/30'
              }`}>
                {isJoined ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityList;
