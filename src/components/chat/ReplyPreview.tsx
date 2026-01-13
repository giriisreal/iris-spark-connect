import { X } from 'lucide-react';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    sender_id: string;
  };
  isOwnMessage: boolean;
  otherName?: string;
  onClear: () => void;
}

const ReplyPreview = ({ replyTo, isOwnMessage, otherName, onClear }: ReplyPreviewProps) => {
  return (
    <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-2">
      <div className="flex-1 border-l-2 border-primary pl-3">
        <p className="text-xs text-muted-foreground">
          Replying to <span className="font-medium">{isOwnMessage ? 'yourself' : otherName || 'them'}</span>
        </p>
        <p className="text-sm text-foreground truncate">
          {replyTo.content.substring(0, 60)}
          {replyTo.content.length > 60 && '...'}
        </p>
      </div>
      <button
        onClick={onClear}
        className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ReplyPreview;
