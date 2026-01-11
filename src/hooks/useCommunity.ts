import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Community {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  member_count: number | null;
}

interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  parent_post_id: string | null;
  title: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  created_at: string;
  author?: {
    name: string;
    id: string;
  };
  replies?: CommunityPost[];
  userVote?: 'up' | 'down' | null;
}

interface CommunityMembership {
  id: string;
  community_id: string;
  profile_id: string;
  joined_at: string;
}

export const useCommunity = (communityId?: string) => {
  const { profile } = useProfile();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<CommunityMembership[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // Fetch all communities
  const fetchCommunities = useCallback(async () => {
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });

    if (data) {
      setCommunities(data);
    }
  }, []);

  // Fetch user's joined communities
  const fetchJoinedCommunities = useCallback(async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('community_members')
      .select('*')
      .eq('profile_id', profile.id);

    if (data) {
      setJoinedCommunities(data);
    }
  }, [profile?.id]);

  // Fetch posts for a community
  const fetchPosts = useCallback(async (cId?: string) => {
    const targetCommunityId = cId || communityId;
    if (!targetCommunityId) return;

    setPostsLoading(true);

    // Fetch top-level posts
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .eq('community_id', targetCommunityId)
      .is('parent_post_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (postsData) {
      // Fetch author names
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', authorIds);

      const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

      // Fetch replies for each post
      const postsWithReplies = await Promise.all(
        postsData.map(async (post) => {
          const { data: replies } = await supabase
            .from('community_posts')
            .select('*')
            .eq('parent_post_id', post.id)
            .order('created_at', { ascending: true });

          // Fetch user's vote for this post
          let userVote: 'up' | 'down' | null = null;
          if (profile?.id) {
            const { data: vote } = await supabase
              .from('post_votes')
              .select('vote_type')
              .eq('post_id', post.id)
              .eq('profile_id', profile.id)
              .maybeSingle();
            userVote = vote?.vote_type as 'up' | 'down' | null;
          }

          const replyAuthorIds = [...new Set(replies?.map(r => r.author_id) || [])];
          const { data: replyAuthors } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', replyAuthorIds.length > 0 ? replyAuthorIds : ['none']);

          const replyAuthorMap = new Map(replyAuthors?.map(a => [a.id, a]) || []);

          return {
            ...post,
            author: authorMap.get(post.author_id),
            userVote,
            replies: replies?.map(r => ({
              ...r,
              author: replyAuthorMap.get(r.author_id),
            })) || [],
          };
        })
      );

      setPosts(postsWithReplies as CommunityPost[]);
    }

    setPostsLoading(false);
  }, [communityId, profile?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCommunities(), fetchJoinedCommunities()]);
      if (communityId) {
        await fetchPosts();
      }
      setLoading(false);
    };
    loadData();
  }, [fetchCommunities, fetchJoinedCommunities, fetchPosts, communityId]);

  const joinCommunity = useCallback(async (cId: string) => {
    if (!profile?.id) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: cId,
        profile_id: profile.id,
      });

    if (!error) {
      await fetchJoinedCommunities();
      // Update member count
      await supabase
        .from('communities')
        .update({ member_count: communities.find(c => c.id === cId)?.member_count || 0 + 1 })
        .eq('id', cId);
    }

    return { error };
  }, [profile?.id, fetchJoinedCommunities, communities]);

  const leaveCommunity = useCallback(async (cId: string) => {
    if (!profile?.id) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', cId)
      .eq('profile_id', profile.id);

    if (!error) {
      await fetchJoinedCommunities();
    }

    return { error };
  }, [profile?.id, fetchJoinedCommunities]);

  const createPost = useCallback(async (
    cId: string,
    content: string,
    title?: string,
    parentPostId?: string
  ) => {
    if (!profile?.id) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: cId,
        author_id: profile.id,
        content,
        title: title || null,
        parent_post_id: parentPostId || null,
      })
      .select()
      .single();

    if (!error) {
      await fetchPosts(cId);
    }

    return { data, error };
  }, [profile?.id, fetchPosts]);

  const votePost = useCallback(async (postId: string, voteType: 'up' | 'down') => {
    if (!profile?.id) return { error: 'Not authenticated' };

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('post_votes')
      .select('*')
      .eq('post_id', postId)
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote
        await supabase
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);

        // Update post counts
        const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
        const post = posts.find(p => p.id === postId);
        if (post) {
          await supabase
            .from('community_posts')
            .update({ [updateField]: Math.max(0, post[updateField] - 1) })
            .eq('id', postId);
        }
      } else {
        // Change vote
        await supabase
          .from('post_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        const post = posts.find(p => p.id === postId);
        if (post) {
          const incField = voteType === 'up' ? 'upvotes' : 'downvotes';
          const decField = voteType === 'up' ? 'downvotes' : 'upvotes';
          await supabase
            .from('community_posts')
            .update({
              [incField]: post[incField as 'upvotes' | 'downvotes'] + 1,
              [decField]: Math.max(0, post[decField as 'upvotes' | 'downvotes'] - 1),
            })
            .eq('id', postId);
        }
      }
    } else {
      // New vote
      await supabase
        .from('post_votes')
        .insert({
          post_id: postId,
          profile_id: profile.id,
          vote_type: voteType,
        });

      const post = posts.find(p => p.id === postId);
      if (post) {
        const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
        await supabase
          .from('community_posts')
          .update({ [updateField]: post[updateField] + 1 })
          .eq('id', postId);
      }
    }

    await fetchPosts();
    return { error: null };
  }, [profile?.id, posts, fetchPosts]);

  const deletePost = useCallback(async (postId: string) => {
    if (!profile?.id) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', profile.id);

    if (!error) {
      await fetchPosts();
    }

    return { error };
  }, [profile?.id, fetchPosts]);

  const isJoined = useCallback((cId: string) => {
    return joinedCommunities.some(m => m.community_id === cId);
  }, [joinedCommunities]);

  return {
    communities,
    joinedCommunities,
    posts,
    loading,
    postsLoading,
    joinCommunity,
    leaveCommunity,
    createPost,
    votePost,
    deletePost,
    isJoined,
    refreshPosts: fetchPosts,
    refreshCommunities: fetchCommunities,
  };
};
