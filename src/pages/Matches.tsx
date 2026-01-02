import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User, ArrowLeft } from 'lucide-react';

const Matches = () => {
  const { user } = useAuth();
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
        <h1 className="text-xl font-bold text-foreground">Matches</h1>
      </nav>
      
      <div className="p-4 text-center py-20">
        <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No matches yet</h3>
        <p className="text-muted-foreground mb-6">Keep swiping to find your match!</p>
        <Button variant="hero" onClick={() => navigate('/discover')}>
          <Heart className="w-5 h-5" /> Start Swiping
        </Button>
      </div>
    </div>
  );
};

export default Matches;
