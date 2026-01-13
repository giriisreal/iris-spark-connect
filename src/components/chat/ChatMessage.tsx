import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Reply, X } from 'lucide-react';
import MessageReactions from './MessageReactions';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  media_url?: string | null;
  media_type?: string | null;
  reply_to_id?: string | null;
  reply_to?: {
    content: string;
    sender_id: string;
  } | null;
}

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  reactions: Reaction[];
  onReply: (message: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  index: number;
  otherName?: string;
}

const ChatMessage = ({ 
  message, 
  isOwn, 
  reactions, 
  onReply, 
  onAddReaction, 
  onRemoveReaction,
  index,
  otherName 
}: ChatMessageProps) => {
  const [showReplyButton, setShowReplyButton] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      <div className="flex items-end gap-1 max-w-[75%]">
        {/* Reply button for other's messages (left side) */}
        {!isOwn && showReplyButton && (
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-2"
          >
            <Reply className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex flex-col">
          {/* Reply reference */}
          {message.reply_to && (
            <div className={`text-xs px-3 py-1 rounded-t-lg border-l-2 ${
              isOwn 
                ? 'bg-primary/30 border-primary-foreground/50 text-primary-foreground/80' 
                : 'bg-muted border-primary text-muted-foreground'
            }`}>
              <span className="font-medium">
                {message.reply_to.sender_id === message.sender_id ? 'You' : otherName || 'Them'}:
              </span>{' '}
              {message.reply_to.content.substring(0, 50)}
              {message.reply_to.content.length > 50 && '...'}
            </div>
          )}
          
          {/* Message bubble */}
          <div
            className={`rounded-xl px-4 py-2 border-2 border-foreground ${
              message.reply_to ? 'rounded-t-none' : ''
            } ${
              isOwn
                ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                : 'bg-card text-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
            }`}
          >
            {/* Media content */}
            {message.media_url && (
              <div className="mb-2">
                {message.media_type === 'image' ? (
                  <img 
                    src={message.media_url} 
                    alt="Shared image" 
                    className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.media_url!, '_blank')}
                  />
                ) : message.media_type === 'video' ? (
                  <video 
                    src={message.media_url} 
                    className="rounded-lg max-w-full max-h-60" 
                    controls 
                  />
                ) : null}
              </div>
            )}
            
            {/* Text content */}
            {message.content && <p className="text-sm">{message.content}</p>}
            
            {/* Timestamp */}
            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              {isOwn && message.read_at && ' • Read'}
            </p>
          </div>
          
          {/* Reactions */}
          <MessageReactions
            reactions={reactions}
            onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
            onRemoveReaction={(emoji) => onRemoveReaction(message.id, emoji)}
            isOwn={isOwn}
          />
        </div>
        
        {/* Reply button for own messages (right side) */}
        {isOwn && showReplyButton && (
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-2"
          >
            <Reply className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
