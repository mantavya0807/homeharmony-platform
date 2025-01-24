import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function MessageList({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Get messages for this chat
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(*)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Mark unread messages as read
        const unreadMessages = messagesData.filter(
          msg => !msg.read && msg.sender_id !== user.id
        );

        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(msg => msg.id));

          if (updateError) console.error('Error marking messages as read:', updateError);
        }

        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    // Subscribe to new messages and read status updates
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // Fetch the sender information for the new message
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender,
          };

          // If the message is not from current user, mark it as read
          if (payload.new.sender_id !== currentUser?.id) {
            const { error: updateError } = await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', payload.new.id);

            if (updateError) console.error('Error marking message as read:', updateError);
          }

          setMessages(prev => [...prev, newMessage]);
        } else if (payload.eventType === 'UPDATE') {
          // Update read status
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? { ...msg, read: payload.new.read } : msg
          ));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, currentUser?.id]);

  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const MessageComponent = ({ message, isCurrentUser }) => (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        isCurrentUser && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 mt-0.5">
        <AvatarImage src={message.sender?.avatar_url} />
        <AvatarFallback>
          {message.sender?.full_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isCurrentUser && "items-end"
        )}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {message.sender?.full_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        <div className="flex items-end gap-1">
          <div
            className={cn(
              "mt-1 rounded-2xl px-4 py-2",
              isCurrentUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
              "flex items-center justify-center text-center" // Added these classes for center alignment
            )}
          >
            {message.content}
          </div>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">
              {message.read ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map(message => (
        <MessageComponent
          key={message.id}
          message={message}
          isCurrentUser={message.sender_id === currentUser?.id}
        />
      ))}
    </div>
  );
}