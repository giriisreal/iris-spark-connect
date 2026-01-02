import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/discover')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </nav>
      
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-card rounded-3xl shadow-elevated p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          {profile && (
            <>
              <h2 className="text-2xl font-bold text-foreground">{profile.name}, {profile.age}</h2>
              <p className="text-muted-foreground">{profile.city || 'Location not set'}</p>
              {profile.bio && <p className="mt-4 text-foreground">{profile.bio}</p>}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {profile.interests.map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </>
          )}
          <Button variant="destructive" className="mt-8" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
