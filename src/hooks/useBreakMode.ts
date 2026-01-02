import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';

const GENTLE_REMINDER_MINUTES = 30;
const BREAK_SUGGESTION_MINUTES = 60;

export const useBreakMode = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [isBreakModeActive, setIsBreakModeActive] = useState(false);
  const [breakEndTime, setBreakEndTime] = useState<Date | null>(null);
  const sessionStartRef = useRef<Date>(new Date());
  const reminderShownRef = useRef<Set<number>>(new Set());

  // Check if currently in break mode
  useEffect(() => {
    if (profile?.break_mode_until) {
      const breakEnd = new Date(profile.break_mode_until);
      if (breakEnd > new Date()) {
        setIsBreakModeActive(true);
        setBreakEndTime(breakEnd);
      } else {
        setIsBreakModeActive(false);
        setBreakEndTime(null);
      }
    }
  }, [profile?.break_mode_until]);

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000);
      setSessionMinutes(elapsed);

      // Show gentle reminders
      if (elapsed >= GENTLE_REMINDER_MINUTES && !reminderShownRef.current.has(GENTLE_REMINDER_MINUTES)) {
        reminderShownRef.current.add(GENTLE_REMINDER_MINUTES);
        toast({
          title: "Taking a break? 🌿",
          description: "You've been here for 30 minutes. Remember to stretch and hydrate!",
        });
      }

      if (elapsed >= BREAK_SUGGESTION_MINUTES && !reminderShownRef.current.has(BREAK_SUGGESTION_MINUTES)) {
        reminderShownRef.current.add(BREAK_SUGGESTION_MINUTES);
        toast({
          title: "Time for a breather 💚",
          description: "You've been active for an hour. Consider taking a short break - your matches will still be here!",
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [toast]);

  const enableBreakMode = useCallback(async (hours: number) => {
    const breakUntil = new Date();
    breakUntil.setHours(breakUntil.getHours() + hours);

    await updateProfile({ 
      break_mode_until: breakUntil.toISOString() 
    } as any);

    setIsBreakModeActive(true);
    setBreakEndTime(breakUntil);

    toast({
      title: "Break mode enabled 🌙",
      description: `You won't receive notifications for ${hours} hour${hours > 1 ? 's' : ''}. Take care of yourself!`,
    });
  }, [updateProfile, toast]);

  const disableBreakMode = useCallback(async () => {
    await updateProfile({ 
      break_mode_until: null 
    } as any);

    setIsBreakModeActive(false);
    setBreakEndTime(null);

    toast({
      title: "Welcome back! 💚",
      description: "Break mode disabled. Ready to connect again?",
    });
  }, [updateProfile, toast]);

  const getTimeRemaining = useCallback(() => {
    if (!breakEndTime) return null;
    
    const now = new Date();
    const diff = breakEndTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }, [breakEndTime]);

  return {
    isBreakModeActive,
    breakEndTime,
    sessionMinutes,
    enableBreakMode,
    disableBreakMode,
    getTimeRemaining,
  };
};
