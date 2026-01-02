import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfilePhoto } from '@/hooks/useProfile';
import { useState } from 'react';

interface UserProfileViewProps {
  profile: {
    id: string;
    name: string;
    age: number;
    bio: string | null;
    city: string | null;
    interests: string[];
    photos: ProfilePhoto[];
    compatibilityScore?: number;
    distance?: number;
    icebreaker?: string;
  };
  onClose: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  showActions?: boolean;
}

const UserProfileView = ({ profile, onClose, onLike, onDislike, showActions = true }: UserProfileViewProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos.length > 0 ? profile.photos : [];

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg max-h-[90vh] bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo Gallery */}
        <div className="relative aspect-[3/4] bg-muted">
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

          {/* Compatibility Badge */}
          {profile.compatibilityScore && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary border-2 border-foreground text-primary-foreground text-sm font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
              <Sparkles className="w-4 h-4" />
              {profile.compatibilityScore}% Match
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-foreground/80 to-transparent" />

          {/* Name & Location */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <h2 className="text-3xl font-bold text-card mb-1">
              {profile.name}, {profile.age}
            </h2>
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

        {/* Profile Info */}
        <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="font-bold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border-2 border-foreground"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Icebreaker */}
          {profile.icebreaker && (
            <div className="p-4 rounded-xl bg-primary/10 border-2 border-dashed border-primary">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary text-sm">AI Icebreaker</span>
              </div>
              <p className="text-foreground">{profile.icebreaker}</p>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="dislike"
                size="iconXl"
                onClick={onDislike}
              >
                <X className="w-8 h-8" />
              </Button>
              <Button
                variant="like"
                size="iconXl"
                onClick={onLike}
              >
                <Heart className="w-8 h-8" fill="currentColor" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfileView;
