import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, MessageCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-20 lg:py-32">
        <nav className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-foreground">IRIS</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </motion.div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Find Your Perfect Match</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Discover Love,{' '}
              <span className="text-gradient-primary">One Swipe</span>{' '}
              at a Time
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Connect with genuine people who share your interests. IRIS uses smart matching 
              to help you find meaningful connections that last.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Heart className="w-5 h-5" />
                  Start Matching Free
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-8 mt-12 justify-center lg:justify-start"
            >
              <div>
                <p className="text-3xl font-bold text-foreground">2M+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-bold text-foreground">500K+</p>
                <p className="text-sm text-muted-foreground">Matches Made</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-bold text-foreground">4.8</p>
                <p className="text-sm text-muted-foreground">App Rating</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              {/* Profile Cards Stack */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Back Card */}
                <div className="absolute -left-4 -top-4 w-72 h-96 rounded-3xl bg-card shadow-elevated rotate-[-8deg] border border-border" />
                
                {/* Middle Card */}
                <div className="absolute -right-4 -top-2 w-72 h-96 rounded-3xl bg-card shadow-elevated rotate-[5deg] border border-border" />
                
                {/* Front Card */}
                <div className="relative w-72 h-96 rounded-3xl bg-gradient-card shadow-elevated border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/80" />
                  <div className="absolute inset-0 flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-bold text-card mb-1">Sarah, 28</h3>
                      <p className="text-card/80 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        2 miles away
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                    98% Match
                  </div>
                </div>
              </motion.div>

              {/* Floating Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
              >
                <button className="w-14 h-14 rounded-full bg-card shadow-elevated flex items-center justify-center text-destructive hover:scale-110 transition-transform border border-border">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button className="w-16 h-16 rounded-full bg-gradient-primary shadow-elevated flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7" fill="currentColor" />
                </button>
                <button className="w-14 h-14 rounded-full bg-card shadow-elevated flex items-center justify-center text-secondary hover:scale-110 transition-transform border border-border">
                  <Sparkles className="w-6 h-6" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="container mx-auto px-4 pb-20"
      >
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Heart className="w-6 h-6" />}
            title="Smart Matching"
            description="Our algorithm learns your preferences to find compatible matches."
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Real Conversations"
            description="Chat with matches in real-time and build genuine connections."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Safe & Secure"
            description="Your privacy matters. All profiles are verified and protected."
          />
        </div>
      </motion.div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 rounded-2xl bg-card shadow-soft border border-border card-hover">
    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default HeroSection;
