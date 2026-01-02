import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, ProfilePhoto } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, User, LogOut, Camera, Trash2, MapPin, Loader2, Save, Image, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const MAX_PHOTOS = 6;

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, photos, loading, updateProfile, fetchProfile } = useProfile();
  const { uploadPhoto, deletePhoto, uploading } = usePhotoUpload(profile?.id);
  const { requestLocation, loading: locationLoading } = useLocation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    min_age: 18,
    max_age: 50,
    max_distance: 50,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        bio: profile.bio || '',
        city: profile.city || '',
        min_age: profile.min_age || 18,
        max_age: profile.max_age || 50,
        max_distance: profile.max_distance || 50,
      });
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photos.length >= MAX_PHOTOS) {
        toast({
          title: 'Photo limit reached',
          description: `You can only upload up to ${MAX_PHOTOS} photos`,
          variant: 'destructive',
        });
        return;
      }
      await uploadPhoto(file);
      fetchProfile();
    }
  };

  const handleDeletePhoto = async (photo: ProfilePhoto) => {
    const success = await deletePhoto(photo.id, photo.photo_url);
    if (success) {
      fetchProfile();
    }
  };

  const handleSetPrimary = async (photo: ProfilePhoto) => {
    // Unset all other primary photos
    await supabase
      .from('profile_photos')
      .update({ is_primary: false })
      .eq('profile_id', profile?.id);
    
    // Set this photo as primary
    await supabase
      .from('profile_photos')
      .update({ is_primary: true })
      .eq('id', photo.id);

    toast({
      title: 'Primary photo updated',
      description: 'This photo will be shown first on your profile',
    });
    
    fetchProfile();
  };

  const handleUpdateLocation = async () => {
    const loc = await requestLocation();
    if (loc && profile) {
      await updateProfile({
        location_lat: loc.lat,
        location_lng: loc.lng,
      });
      fetchProfile();
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    const { error } = await updateProfile(formData);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved',
      });
      setEditing(false);
    }
    setSaving(false);
  };

  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="p-4 flex items-center gap-4 border-b-2 border-foreground bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <img src={logo} alt="IRIS" className="w-6 h-6 object-contain" />
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>
        {!editing ? (
          <Button variant="retro" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        )}
      </nav>
      
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Photos Section */}
        <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Image className="w-5 h-5" />
              Photos ({photos.length}/{MAX_PHOTOS})
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <motion.div 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-foreground group"
              >
                <img 
                  src={photo.photo_url} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                {photo.is_primary && (
                  <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-secondary border-2 border-foreground flex items-center justify-center">
                    <Star className="w-3 h-3 text-secondary-foreground" fill="currentColor" />
                  </div>
                )}
                <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSetPrimary(photo)}
                    className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border-2 border-foreground"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center border-2 border-foreground"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {/* Add Photo Slots */}
            {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, idx) => (
              <button
                key={`empty-${idx}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-foreground/50 flex flex-col items-center justify-center hover:border-primary transition-colors disabled:opacity-50 bg-muted/30"
              >
                {uploading && idx === 0 ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </>
                )}
              </button>
            ))}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground mt-3">
            Upload up to 6 photos. Click the star to set your primary photo.
          </p>
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            About You
          </h2>
          
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-2 border-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself..."
                  className="resize-none h-24 border-2 border-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Where are you located?"
                  className="border-2 border-foreground"
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              {primaryPhoto ? (
                <img 
                  src={primaryPhoto.photo_url} 
                  alt={profile?.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-foreground"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 border-4 border-foreground">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
              )}
              <h3 className="text-2xl font-bold text-foreground">{profile?.name}, {profile?.age}</h3>
              <p className="text-muted-foreground">{profile?.city || 'Location not set'}</p>
              {profile?.bio && <p className="mt-4 text-foreground">{profile.bio}</p>}
              
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {profile?.interests?.map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border-2 border-foreground">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-6"
            >
              <h2 className="font-bold text-foreground">Preferences</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Age Range</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {formData.min_age} - {formData.max_age}
                  </span>
                </div>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.min_age}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_age: parseInt(e.target.value) }))}
                    className="w-20 border-2 border-foreground"
                  />
                  <span className="text-muted-foreground self-center">to</span>
                  <Input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.max_age}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_age: parseInt(e.target.value) }))}
                    className="w-20 border-2 border-foreground"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Maximum Distance</Label>
                  <span className="text-sm text-muted-foreground font-medium">
                    {formData.max_distance} miles
                  </span>
                </div>
                <Slider
                  value={[formData.max_distance]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, max_distance: value[0] }))}
                  min={1}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:border-2 [&_[role=slider]]:border-foreground"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location */}
        <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile?.location_lat 
                  ? 'Location set ✓' 
                  : 'Enable to find nearby matches'}
              </p>
            </div>
            <Button 
              variant="retro" 
              size="sm"
              onClick={handleUpdateLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              Update
            </Button>
          </div>
        </div>

        {/* Sign Out */}
        <Button variant="destructive" className="w-full" onClick={signOut}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
