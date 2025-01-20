import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
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
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload) => {
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

        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          "flex flex-col",
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
        <div
          className={cn(
            "mt-1 rounded-2xl px-4 py-2 max-w-[80%]",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col space-y-6">
      {Object.entries(messageGroups).map(([date, messages]) => (
        <div key={date} className="space-y-4">
          <div className="sticky top-0 flex justify-center">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">
              {date === new Date().toLocaleDateString() ? 'Today' : date}
            </span>
          </div>
          {messages.map(message => (
            <MessageComponent
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === currentUser?.id}
            />
          ))}
        </div>
      ))}
    </div>
  );
}