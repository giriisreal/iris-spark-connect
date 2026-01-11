import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCommunity } from '@/hooks/useCommunity';
import { useSubscription, FREE_LIMITS } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Send,
  Loader2,
  Crown,
  Reply,
  Trash2,
  Pin,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const Community = () => {
  const navigate = useNavigate();
  const { communityId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  
  const {
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
    refreshPosts,
  } = useCommunity(communityId);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const currentCommunity = communities.find(c => c.id === communityId);
  const canJoinMore = isPremium || joinedCommunities.length < FREE_LIMITS.MAX_COMMUNITIES;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleJoin = async (cId: string) => {
    if (!canJoinMore && !isJoined(cId)) {
      toast({
        title: "Community Limit Reached",
        description: "Upgrade to Premium to join unlimited communities!",
        variant: "destructive",
      });
      return;
    }

    const { error } = await joinCommunity(cId);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Joined!",
        description: `You're now a member of this community`,
      });
    }
  };

  const handleLeave = async (cId: string) => {
    const { error } = await leaveCommunity(cId);
    if (!error) {
      toast({
        title: "Left Community",
        description: "You've left this community",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!communityId || !newPostContent.trim()) return;

    setSubmitting(true);
    const { error } = await createPost(communityId, newPostContent, newPostTitle || undefined);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      setNewPostTitle('');
      setNewPostContent('');
      toast({
        title: "Posted!",
        description: "Your post is now live",
      });
    }
    setSubmitting(false);
  };

  const handleReply = async (postId: string) => {
    if (!communityId || !replyContent.trim()) return;

    setSubmitting(true);
    const { error } = await createPost(communityId, replyContent, undefined, postId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    } else {
      setReplyingTo(null);
      setReplyContent('');
    }
    setSubmitting(false);
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    await votePost(postId, type);
  };

  const handleDelete = async (postId: string) => {
    const { error } = await deletePost(postId);
    if (!error) {
      toast({
        title: "Deleted",
        description: "Post removed",
      });
    }
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Community List View
  if (!communityId) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="p-4 flex items-center gap-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Communities</h1>
        </nav>

        <div className="p-4 max-w-2xl mx-auto">
          {!isPremium && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan: {joinedCommunities.length}/{FREE_LIMITS.MAX_COMMUNITIES} community</p>
                  <p className="text-sm text-muted-foreground">Upgrade for unlimited access</p>
                </div>
                <Button size="sm" onClick={() => navigate('/premium')}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {communities.map((community) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                            {community.icon || '👥'}
                          </div>
                          <div>
                            <h3 className="font-bold">{community.name}</h3>
                            <p className="text-sm text-muted-foreground">{community.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{community.member_count || 0} members</span>
                              <span>•</span>
                              <span>{community.category}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isJoined(community.id) ? "outline" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            isJoined(community.id) 
                              ? handleLeave(community.id) 
                              : handleJoin(community.id);
                          }}
                        >
                          {isJoined(community.id) ? 'Joined' : 'Join'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Community Detail View
  return (
    <div className="min-h-screen bg-background">
      <nav className="p-4 flex items-center gap-4 border-b sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold">{currentCommunity?.name || 'Community'}</h1>
          <p className="text-xs text-muted-foreground">
            {currentCommunity?.member_count || 0} members
          </p>
        </div>
        {currentCommunity && (
          <Button
            size="sm"
            variant={isJoined(communityId) ? "outline" : "default"}
            onClick={() => 
              isJoined(communityId) 
                ? handleLeave(communityId) 
                : handleJoin(communityId)
            }
          >
            {isJoined(communityId) ? 'Leave' : 'Join'}
          </Button>
        )}
      </nav>

      <div className="p-4 max-w-2xl mx-auto">
        {/* New Post Form */}
        {isJoined(communityId) && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Post title (optional)"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="Share your thoughts..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleCreatePost} 
                disabled={!newPostContent.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={post.is_pinned ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      {/* Post Header */}
                      <div className="flex items-start gap-3">
                        {/* Vote Controls */}
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${post.userVote === 'up' ? 'text-primary' : ''}`}
                            onClick={() => handleVote(post.id, 'up')}
                          >
                            <ChevronUp className="w-5 h-5" />
                          </Button>
                          <span className="text-sm font-medium">
                            {post.upvotes - post.downvotes}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${post.userVote === 'down' ? 'text-destructive' : ''}`}
                            onClick={() => handleVote(post.id, 'down')}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* Post Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                            <span className="text-sm font-medium">{post.author?.name || 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {post.title && <h4 className="font-bold mb-1">{post.title}</h4>}
                          <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                            {post.replies && post.replies.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleReplies(post.id)}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                              </Button>
                            )}
                          </div>

                          {/* Reply Input */}
                          {replyingTo === post.id && (
                            <div className="mt-3 flex gap-2">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={2}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReply(post.id)}
                                disabled={!replyContent.trim() || submitting}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          {/* Replies */}
                          {expandedReplies.has(post.id) && post.replies && (
                            <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                              {post.replies.map((reply) => (
                                <div key={reply.id} className="text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{reply.author?.name || 'Anonymous'}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
