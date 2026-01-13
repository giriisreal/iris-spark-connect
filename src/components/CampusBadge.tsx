import { GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

interface CampusBadgeProps {
  college: string;
  className?: string;
}

const CampusBadge = ({ college, className = '' }: CampusBadgeProps) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.3 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))] ${className}`}
    >
      <GraduationCap className="w-3 h-3" />
      <span>From your campus</span>
    </motion.div>
  );
};

export default CampusBadge;
