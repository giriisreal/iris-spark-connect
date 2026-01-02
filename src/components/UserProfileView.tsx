import { motion } from 'framer-motion';
import { X, MapPin, Heart, Sparkles, MessageCircle, Shield, Users, Zap, Mic, Quote, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfilePhoto } from '@/hooks/useProfile';
import { useMemo, useState } from 'react';

interface UserProfileViewProps {
  profile: {
    id: string;
    name: string;
    age: number;
    bio: string | null;
    city: string | null;
    interests: string[];
    photos?: ProfilePhoto[];
    compatibilityScore?: number;
    distance?: number;
    icebreaker?: string;
    vibeStatus?: string;
    pronouns?: string;
    nonNegotiables?: string[];
    voiceIntroUrl?: string;
    pickupLines?: string[];
    personalNotes?: string[];
    energyPreferences?: {
      humor: number;
      music: number;
      texting: number;
    };
    communities?: string[];
  };
  onClose: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  showActions?: boolean;
}

const vibeEmojis: Record<string, string> = {
  chill: '😌',
  energetic: '⚡',
  deep_talks: '🌙',
  fun_chaotic: '🎉',
  romantic: '💕',
  adventurous: '🏔️',
};

const UserProfileView = ({ profile, onClose, onLike, onDislike, showActions = true }: UserProfileViewProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = useMemo(() => (profile.photos?.length ? profile.photos : []), [profile.photos]);

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const getEnergyLabel = (value: number) => {
    if (value < 30) return 'Low';
    if (value < 70) return 'Medium';
    return 'High';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg max-h-[90vh] bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Fixed Position */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Photo Gallery */}
          <div className="relative aspect-[3/4] bg-muted flex-shrink-0">
            {photos.length > 0 ? (
              <>
                <img
                  src={photos[currentPhotoIndex].photo_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Photo Navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                    />
                    <button
                      onClick={nextPhoto}
                      className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                    />
                    
                    {/* Photo Indicators */}
                    <div className="absolute top-4 left-4 right-14 flex gap-1 z-10">
                      {photos.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            idx === currentPhotoIndex ? 'bg-card' : 'bg-card/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <span className="text-6xl">👤</span>
              </div>
            )}

            {/* Vibe Status Badge */}
            {profile.vibeStatus && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-secondary border-2 border-foreground text-secondary-foreground text-sm font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <span>{vibeEmojis[profile.vibeStatus] || '✨'}</span>
                {profile.vibeStatus.replace('_', ' ')}
              </div>
            )}

            {/* Compatibility Badge */}
            {profile.compatibilityScore && (
              <div className="absolute top-16 left-4 px-3 py-1.5 rounded-full bg-primary border-2 border-foreground text-primary-foreground text-sm font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
                <Sparkles className="w-4 h-4" />
                {profile.compatibilityScore}% Match
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-foreground/90 to-transparent" />

            {/* Name & Location */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-card">
                  {profile.name}, {profile.age}
                </h2>
                {profile.pronouns && (
                  <span className="text-card/70 text-sm">({profile.pronouns})</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-card/80 text-sm">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.city}
                  </span>
                )}
                {profile.distance !== undefined && (
                  <span>• {profile.distance} miles away</span>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="border-b-2 border-foreground bg-card p-3">
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentPhotoIndex ? 'border-primary' : 'border-foreground/50'
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img
                      src={p.photo_url}
                      alt={`${profile.name} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Profile Info Section */}
          <div className="p-6 space-y-6">
            {/* Voice Intro */}
            {profile.voiceIntroUrl && (
              <div className="space-y-2">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" /> Voice intro
                </h3>
                <audio
                  src={profile.voiceIntroUrl}
                  controls
                  className="w-full h-10"
                />
              </div>
            )}

            {/* About Section */}
            {profile.bio && (
              <div className="space-y-2">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <span className="text-lg">✨</span> About
                </h3>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Energy Score */}
            {profile.energyPreferences && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> Energy Match
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'humor', label: 'Humor', icon: '😂' },
                    { key: 'music', label: 'Music Taste', icon: '🎵' },
                    { key: 'texting', label: 'Texting Style', icon: '💬' }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium w-24">{label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${profile.energyPreferences![key as keyof typeof profile.energyPreferences]}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {getEnergyLabel(profile.energyPreferences![key as keyof typeof profile.energyPreferences])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent" /> Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Negotiables */}
            {profile.nonNegotiables && profile.nonNegotiables.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-destructive" /> Things I won't compromise on
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.nonNegotiables.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium border-2 border-destructive/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup Lines */}
            {profile.pickupLines && profile.pickupLines.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Quote className="w-5 h-5 text-accent" /> My Pickup Lines
                </h3>
                <div className="space-y-2">
                  {profile.pickupLines.map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-xl bg-accent/10 border-2 border-accent/30 italic text-foreground"
                    >
                      "{line}"
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Notes */}
            {profile.personalNotes && profile.personalNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-secondary" /> About Me Notes
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {profile.personalNotes.map((note, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-lg bg-secondary/20 border-2 border-secondary/30 text-foreground text-sm"
                    >
                      📝 {note}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {profile.communities && profile.communities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Communities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.communities.map((community, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border-2 border-primary/30"
                    >
                      {community}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Icebreaker */}
            {profile.icebreaker && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary text-sm">AI Icebreaker</span>
                  <Sparkles className="w-3 h-3 text-accent" />
                </div>
                <p className="text-foreground italic">"{profile.icebreaker}"</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="flex items-center justify-center gap-6 pt-4 pb-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="dislike"
                    size="iconXl"
                    onClick={onDislike}
                  >
                    <X className="w-8 h-8" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="like"
                    size="iconXl"
                    onClick={onLike}
                  >
                    <Heart className="w-8 h-8" fill="currentColor" />
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfileView;
