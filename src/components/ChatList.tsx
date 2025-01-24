import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ChatList({ selectedChat, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user.id);
        
        // Get all chats the user is part of
        const { data: participations, error: participationsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (participationsError) throw participationsError;

        const chatIds = participations.map(p => p.chat_id);

        // Get chat details
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            chat_participants!inner(
              profiles(*)
            ),
            messages(
              id,
              content,
              created_at,
              sender_id,
              read,
              sender:profiles(*)
            )
          `)
          .in('id', chatIds)
          .order('updated_at', { ascending: false });

        if (chatsError) throw chatsError;

        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Subscribe to new messages and read status updates
    const subscription = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const chatIndex = updatedChats.findIndex(chat => chat.id === payload.new.chat_id);
          if (chatIndex > -1) {
            const chat = { ...updatedChats[chatIndex] };
            chat.messages = [...chat.messages, payload.new];
            // Move this chat to the top
            updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chat);
          }
          return updatedChats;
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.id === payload.new.chat_id) {
              return {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === payload.new.id ? { ...msg, read: payload.new.read } : msg
                ),
              };
            }
            return chat;
          });
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return null;
    return chat.messages[chat.messages.length - 1];
  };

  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter(msg => 
      msg.sender_id !== currentUserId && !msg.read
    ).length;
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') return chat.name;
    
    // For individual chats, show the other participant's name
    const otherParticipant = chat.chat_participants
      .find(cp => cp.profiles.id !== currentUserId)?.profiles;
    return otherParticipant?.full_name || 'Unknown User';
  };

  if (loading) {
    return <div className="p-4">Loading chats...</div>;
  }

  return (
    <div className="space-y-2 p-2">
      {chats.map(chat => {
        const lastMessage = getLastMessage(chat);
        const unreadCount = getUnreadCount(chat);
        const isSelected = selectedChat?.id === chat.id;

        return (
          <button
            key={chat.id}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isSelected && "bg-accent text-accent-foreground"
            )}
            onClick={() => onSelectChat(chat)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chat.type === 'group' ? null : chat.chat_participants[0]?.profiles.avatar_url} />
                <AvatarFallback>
                  {chat.type === 'group' ? chat.name[0] : chat.chat_participants[0]?.profiles.full_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium truncate flex items-center gap-2">
                    {getChatName(chat)}
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] px-1 rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
                  </p>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(lastMessage.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {lastMessage && (
                  <p className={cn(
                    "text-sm truncate",
                    unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {lastMessage.sender?.full_name}: {lastMessage.content}
                  </p>
                )}
                {chat.type === 'group' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {chat.area}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}