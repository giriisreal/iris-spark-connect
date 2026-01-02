import { motion } from 'framer-motion';
import { Moon, Sun, Coffee, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreakMode } from '@/hooks/useBreakMode';

const BreakModePanel = () => {
  const {
    isBreakModeActive,
    sessionMinutes,
    enableBreakMode,
    disableBreakMode,
    getTimeRemaining,
  } = useBreakMode();

  const timeRemaining = getTimeRemaining();

  const breakOptions = [
    { hours: 1, label: '1 hour', icon: Coffee },
    { hours: 4, label: '4 hours', icon: Clock },
    { hours: 24, label: '1 day', icon: Moon },
  ];

  if (isBreakModeActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6"
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center"
          >
            <Moon className="w-8 h-8 text-secondary-foreground" />
          </motion.div>

          <div>
            <h3 className="font-bold text-lg text-foreground">Break Mode Active</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Taking time for yourself is important 💚
            </p>
          </div>

          {timeRemaining && (
            <div className="py-3 px-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Time remaining:</p>
              <p className="text-xl font-bold text-foreground">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </p>
            </div>
          )}

          <Button
            variant="retro"
            onClick={disableBreakMode}
            className="w-full"
          >
            <Sun className="w-4 h-4 mr-2" />
            End Break Early
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Mental Health</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Need a breather? Enable break mode to pause notifications and take time for yourself.
      </p>

      {sessionMinutes > 0 && (
        <div className="py-2 px-3 rounded-lg bg-muted/50 text-sm">
          <span className="text-muted-foreground">Session time: </span>
          <span className="font-medium text-foreground">{sessionMinutes} minutes</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {breakOptions.map(({ hours, label, icon: Icon }) => (
          <Button
            key={hours}
            variant="retro"
            size="sm"
            onClick={() => enableBreakMode(hours)}
            className="flex-col h-auto py-3"
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can end break mode anytime. Your matches aren't going anywhere! 🌿
      </p>
    </motion.div>
  );
};

export default BreakModePanel;
