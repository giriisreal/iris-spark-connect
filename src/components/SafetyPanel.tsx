import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Share2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SafetyPanelProps {
  profileId: string;
  onBlock?: () => void;
  onReport?: () => void;
}

const SafetyPanel = ({ profileId, onBlock, onReport }: SafetyPanelProps) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile) {
        await supabase.from('safety_reports').insert({
          reporter_id: profile.id,
          reported_id: profileId,
          reason: reportReason,
        });
      }
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setShowReportModal(false);
      onReport?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportReasons = [
    'Inappropriate content',
    'Harassment or bullying',
    'Fake profile',
    'Spam or scam',
    'Underage user',
    'Other',
  ];

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Safety First
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBlock}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Block
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          🔒 Your safety matters. Screenshot detection is active.
        </p>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Report User</h3>
            <p className="text-muted-foreground mb-4">
              Help us keep the community safe. Select a reason:
            </p>
            <div className="space-y-2 mb-4">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    reportReason === reason
                      ? 'border-destructive bg-destructive/10'
                      : 'border-border hover:border-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReport}
                disabled={!reportReason || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default SafetyPanel;
