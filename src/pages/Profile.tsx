import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, ProfilePhoto } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, User, LogOut, Camera, Trash2, MapPin, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="p-4 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1">Profile</h1>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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
        <div className="bg-card rounded-3xl shadow-elevated p-6">
          <h2 className="font-semibold text-foreground mb-4">Photos</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <motion.div 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img 
                  src={photo.photo_url} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(photo)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            
            {/* Add Photo Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-3xl shadow-elevated p-6 space-y-4">
          <h2 className="font-semibold text-foreground">About You</h2>
          
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself..."
                  className="resize-none h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Where are you located?"
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              {primaryPhoto ? (
                <img 
                  src={primaryPhoto.photo_url} 
                  alt={profile?.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
              )}
              <h3 className="text-2xl font-bold text-foreground">{profile?.name}, {profile?.age}</h3>
              <p className="text-muted-foreground">{profile?.city || 'Location not set'}</p>
              {profile?.bio && <p className="mt-4 text-foreground">{profile.bio}</p>}
              
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {profile?.interests?.map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        {editing && (
          <div className="bg-card rounded-3xl shadow-elevated p-6 space-y-6">
            <h2 className="font-semibold text-foreground">Preferences</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Age Range</Label>
                <span className="text-sm text-muted-foreground">
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
                  className="w-20"
                />
                <span className="text-muted-foreground self-center">to</span>
                <Input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.max_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_age: parseInt(e.target.value) }))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Maximum Distance</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.max_distance} miles
                </span>
              </div>
              <Slider
                value={[formData.max_distance]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, max_distance: value[0] }))}
                min={1}
                max={100}
                step={1}
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div className="bg-card rounded-3xl shadow-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Location</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.location_lat 
                  ? 'Location set' 
                  : 'Enable to find nearby matches'}
              </p>
            </div>
            <Button 
              variant="outline" 
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
