import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Shield, ArrowRight, Zap, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import sampleProfile1 from '@/assets/sample-profile-1.jpg';
import sampleProfile2 from '@/assets/sample-profile-2.jpg';
import sampleProfile3 from '@/assets/sample-profile-3.jpg';
import sampleProfile4 from '@/assets/sample-profile-4.jpg';

const sampleProfiles = [
  {
    id: 1,
    name: 'Priya',
    age: 23,
    location: 'Mumbai',
    image: sampleProfile1,
    interests: ['Photography', 'Travel'],
    college: 'IIT Bombay',
  },
  {
    id: 2,
    name: 'Arjun',
    age: 25,
    location: 'Delhi',
    image: sampleProfile2,
    interests: ['Music', 'Fitness'],
    college: 'Delhi University',
  },
  {
    id: 3,
    name: 'Ananya',
    age: 22,
    location: 'Bangalore',
    image: sampleProfile3,
    interests: ['Art', 'Reading'],
    college: 'BITS Pilani',
  },
  {
    id: 4,
    name: 'Rahul',
    age: 24,
    location: 'Pune',
    image: sampleProfile4,
    interests: ['Gaming', 'Cooking'],
    college: 'VIT Pune',
  },
];

const ProfileCard = ({ profile, index }: { profile: typeof sampleProfiles[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? -3 : 3 }}
    animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -3 : 3 }}
    transition={{ delay: 0.6 + index * 0.1 }}
    whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
    className="relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] bg-card cursor-pointer flex-shrink-0"
  >
    <img
      src={profile.image}
      alt={profile.name}
      className="w-full h-full object-cover"
    />
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    
    {/* Profile Info */}
    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="flex items-center gap-1 text-sm text-white/80 mb-2">
        <MapPin className="w-3 h-3" />
        {profile.location} • {profile.college}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {profile.interests.map((interest) => (
          <span
            key={interest}
            className="px-2 py-0.5 text-xs bg-white/20 backdrop-blur-sm rounded-full"
          >
            {interest}
          </span>
        ))}
      </div>
    </div>

    {/* Action Buttons */}
    <div className="absolute bottom-4 right-4 flex gap-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
      >
        <X className="w-5 h-5 text-white" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-white/30"
      >
        <Heart className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src={logo}
              alt="IRIS"
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-foreground">
              
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center pt-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-8 border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
          >
            <Sparkles className="w-4 h-4" />
            New: AI-Powered Matchmaking
            <ArrowRight className="w-4 h-4" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Find Your Match.
            <br className="hidden sm:block" />
            Swipe Smart.
            <span className="inline-block px-4 py-1 border-2 border-dashed border-primary text-primary rounded-lg mt-2">
              Start Free.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            A modern dating platform powered by AI to find meaningful
            connections. Smart matching, real conversations, genuine
            people.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="lg">
                Start for free
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroSecondary" size="lg">
                Book a Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Zap className="w-5 h-5" />
                AI-Powered
              </div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Shield className="w-5 h-5" />
                Verified
              </div>
            </div>
          </motion.div>
        </div>

        {/* Profile Preview Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 pb-8"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-center text-2xl md:text-3xl font-bold text-foreground mb-8"
          >
            Meet Amazing People
          </motion.h2>
          
          <div className="flex justify-center gap-6 flex-wrap px-4">
            {sampleProfiles.map((profile, index) => (
              <ProfileCard key={profile.id} profile={profile} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
