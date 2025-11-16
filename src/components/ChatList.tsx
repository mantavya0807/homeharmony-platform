import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';
import { Search, Loader2, MessageSquare } from 'lucide-react';

export function ChatList({ selectedChat, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageMatches, setMessageMatches] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('ChatList: No user found');
          setLoading(false);
          return;
        }
        setCurrentUserId(user.id);
        
        console.log('ChatList: Fetching participations for user:', user.id);
        const { data: participations, error: participationsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('ChatList: Error fetching participations:', participationsError);
          setLoading(false);
          return;
        }

        console.log('ChatList: Found participations:', participations);

        if (!participations?.length) {
          console.log('ChatList: No participations found');
          setLoading(false);
          return;
        }

        const chatIds = participations.map(p => p.chat_id);
        console.log('ChatList: Fetching chats for IDs:', chatIds);

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

        if (chatsError) {
          console.error('ChatList: Error fetching chats:', chatsError);
          setLoading(false);
          return;
        }

        console.log('ChatList: Fetched chats:', chatsData);
        setChats(chatsData || []);
        setFilteredChats(chatsData || []);
      } catch (error) {
        console.error('ChatList: Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Subscribe to changes in messages, chats, and chat_participants
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
        () => fetchChats())
      .subscribe();

    const chatsSubscription = supabase
      .channel('chats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, 
        () => fetchChats())
      .subscribe();

    const participantsSubscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants' }, 
        () => fetchChats())
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      chatsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, []);

  // Enhanced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
      setMessageMatches({});
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches: Record<string, string[]> = {};
    
    const filtered = chats.filter(chat => {
      // Search in chat name/participant name
      const nameMatch = (() => {
        if (chat.type === 'group') {
          return chat.name.toLowerCase().includes(query) || 
                 (chat.area && chat.area.toLowerCase().includes(query));
        } else {
          const participant = chat.chat_participants.find(p => p.profiles.id !== currentUserId);
          return participant?.profiles.full_name.toLowerCase().includes(query);
        }
      })();

      // Search in messages
      const matchingMessages = chat.messages?.filter(msg => 
        msg.content.toLowerCase().includes(query)
      ) || [];

      if (matchingMessages.length > 0) {
        matches[chat.id] = matchingMessages.map(msg => ({
          content: msg.content,
          sender: msg.sender.full_name
        }));
      }

      return nameMatch || matchingMessages.length > 0;
    });

    setFilteredChats(filtered);
    setMessageMatches(matches);
  }, [searchQuery, chats, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <span key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</span> : 
        part
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats and messages..."
            className="pl-10 bg-white/50 dark:bg-black/20 border-blue-100 dark:border-white/10 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {filteredChats.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat, index) => {
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                const unreadCount = chat.messages?.filter(msg => 
                  msg.sender_id !== currentUserId && !msg.read
                ).length || 0;
                const isSelected = selectedChat?.id === chat.id;
                const participant = chat.chat_participants.find(p => p.profiles.id !== currentUserId);
                const matchingMessages = messageMatches[chat.id] || [];

                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <button
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all duration-300",
                        "hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
                        isSelected && "bg-blue-100/50 dark:bg-blue-900/30"
                      )}
                      onClick={() => onSelectChat(chat, unreadCount > 0)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                          <AvatarImage 
                            src={chat.type === 'group' ? null : participant?.profiles.avatar_url} 
                          />
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {chat.type === 'group' ? chat.name[0] : participant?.profiles.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="font-medium text-blue-900 dark:text-white truncate flex items-center gap-2">
                              {highlightText(chat.type === 'group' ? chat.name : participant?.profiles.full_name)}
                              {unreadCount > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="h-5 min-w-[20px] px-1 rounded-full"
                                >
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

                          {/* Show matching messages if any */}
                          {matchingMessages.length > 0 ? (
                            <div className="mt-1 space-y-1">
                              {matchingMessages.map((msg: any, i: number) => (
                                <div 
                                  key={i}
                                  className="flex items-start gap-1 text-sm text-muted-foreground"
                                >
                                  <MessageSquare className="h-3 w-3 mt-1 flex-shrink-0" />
                                  <p className="truncate">
                                    <span className="font-medium">{msg.sender}:</span>{' '}
                                    {highlightText(msg.content)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : lastMessage && (
                            <p className="text-sm truncate text-muted-foreground">
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
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center text-muted-foreground"
            >
              {searchQuery 
                ? "No chats or messages match your search" 
                : "No chats found"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}