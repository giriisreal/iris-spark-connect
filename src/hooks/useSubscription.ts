import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Subscription {
  id: string;
  profile_id: string;
  plan_type: 'free' | 'premium';
  is_lifetime: boolean;
  expires_at: string | null;
  purchased_at: string | null;
}

interface DailyUsage {
  matches_shown: number;
  ai_prompts_used: number;
  openers_sent: number;
}

// Free tier limits
export const FREE_LIMITS = {
  MATCHES_PER_DAY: 5,
  AI_PROMPTS_PER_DAY: 3,
  OPENERS_PER_DAY: 5,
  MAX_COMMUNITIES: 1,
};

export const useSubscription = () => {
  const { profile } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    
    // Fetch subscription
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (subData) {
      setSubscription(subData as Subscription);
      // Check if premium is active
      if (subData.plan_type === 'premium') {
        if (subData.is_lifetime) {
          setIsPremium(true);
        } else if (subData.expires_at) {
          setIsPremium(new Date(subData.expires_at) > new Date());
        }
      }
    } else {
      setIsPremium(false);
    }

    // Fetch or create daily usage
    const { data: usageData } = await supabase
      .rpc('get_or_create_daily_usage', { p_profile_id: profile.id });

    if (usageData) {
      setDailyUsage({
        matches_shown: usageData.matches_shown,
        ai_prompts_used: usageData.ai_prompts_used,
        openers_sent: usageData.openers_sent,
      });
    }

    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canShowMoreMatches = useCallback(() => {
    if (isPremium) return true;
    if (!dailyUsage) return true;
    return dailyUsage.matches_shown < FREE_LIMITS.MATCHES_PER_DAY;
  }, [isPremium, dailyUsage]);

  const canUseAIPrompt = useCallback(() => {
    if (isPremium) return true;
    if (!dailyUsage) return true;
    return dailyUsage.ai_prompts_used < FREE_LIMITS.AI_PROMPTS_PER_DAY;
  }, [isPremium, dailyUsage]);

  const canSendOpener = useCallback(() => {
    if (isPremium) return true;
    if (!dailyUsage) return true;
    return dailyUsage.openers_sent < FREE_LIMITS.OPENERS_PER_DAY;
  }, [isPremium, dailyUsage]);

  const incrementUsage = useCallback(async (type: 'matches' | 'ai_prompts' | 'openers') => {
    if (!profile?.id || isPremium) return;

    const columnMap = {
      matches: 'matches_shown',
      ai_prompts: 'ai_prompts_used',
      openers: 'openers_sent',
    };

    const column = columnMap[type];
    const currentValue = dailyUsage?.[column as keyof DailyUsage] || 0;

    await supabase
      .from('daily_usage')
      .upsert({
        profile_id: profile.id,
        usage_date: new Date().toISOString().split('T')[0],
        [column]: currentValue + 1,
      }, {
        onConflict: 'profile_id,usage_date',
      });

    setDailyUsage(prev => prev ? {
      ...prev,
      [column]: currentValue + 1,
    } : null);
  }, [profile?.id, isPremium, dailyUsage]);

  const getRemainingUsage = useCallback(() => {
    if (isPremium) {
      return {
        matches: Infinity,
        aiPrompts: Infinity,
        openers: Infinity,
      };
    }
    return {
      matches: Math.max(0, FREE_LIMITS.MATCHES_PER_DAY - (dailyUsage?.matches_shown || 0)),
      aiPrompts: Math.max(0, FREE_LIMITS.AI_PROMPTS_PER_DAY - (dailyUsage?.ai_prompts_used || 0)),
      openers: Math.max(0, FREE_LIMITS.OPENERS_PER_DAY - (dailyUsage?.openers_sent || 0)),
    };
  }, [isPremium, dailyUsage]);

  return {
    subscription,
    dailyUsage,
    loading,
    isPremium,
    canShowMoreMatches,
    canUseAIPrompt,
    canSendOpener,
    incrementUsage,
    getRemainingUsage,
    refreshSubscription: fetchSubscription,
  };
};
