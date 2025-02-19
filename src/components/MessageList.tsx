import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from "framer-motion";

const Message = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-start gap-2 mb-4",
        isCurrentUser && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 mt-0.5 border-2 border-primary/10">
        <AvatarImage src={message.sender?.avatar_url} />
        <AvatarFallback className="bg-primary/5 text-primary">
          {message.sender?.full_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isCurrentUser && "items-end"
      )}>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-blue-900 dark:text-white">
            {message.sender?.full_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>
        
        <div className="flex items-end gap-2">
          <div className={cn(
            "mt-1 rounded-2xl px-4 py-2",
            isCurrentUser 
              ? "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white"
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-white"
          )}>
            {message.content}
          </div>
          
          {isCurrentUser && (
            <div className={cn(
              "flex items-center transition-opacity",
              "text-blue-500 dark:text-blue-400",
              message.read ? "opacity-100" : "opacity-70"
            )}>
              <Check className="h-4 w-4" />
              {message.read && <Check className="h-4 w-4 -ml-2" />}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export function MessageList({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(*)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        setMessages(messagesData || []);

        // Mark unread messages as read
        const unreadMessages = messagesData?.filter(
          msg => !msg.read && msg.sender_id !== currentUserId
        ) || [];

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: sender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.sender_id)
              .single();

            setMessages(prev => [...prev, { ...payload.new, sender }]);

            // Mark message as read if we're the receiver
            if (payload.new.sender_id !== currentUserId) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', payload.new.id);
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isCurrentUser={message.sender_id === currentUserId}
        />
      ))}
    </div>
  );
}