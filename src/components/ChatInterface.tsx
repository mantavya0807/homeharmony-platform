import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MessageSquare, Users, Plus, Send, Loader2 } from 'lucide-react';
import { ChatList } from './ChatList';
import { MessageList } from './MessageList';
import { CreateChatDialog } from './CreateChatDialog';
import { useToast } from '@/components/ui/use-toast';

export function ChatInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  const scrollToBottom = (immediate = false) => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const scrollOptions = immediate ? { behavior: 'instant' } : { behavior: 'smooth' };
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          ...scrollOptions
        });
      }
    }
  };

  const scrollToFirstUnread = async (chatId: string) => {
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .eq('read', false)
        .neq('sender_id', currentUserId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (messages?.[0]) {
        const unreadElement = document.getElementById(`message-${messages[0].id}`);
        if (unreadElement && scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          scrollToBottom(true);
        }
      } else {
        scrollToBottom(true);
      }
    } catch (error) {
      console.error('Error scrolling to unread message:', error);
      scrollToBottom(true);
    }
  };

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (location.state?.chatId) {
        setLoading(true);
        try {
          const { data: chat, error } = await supabase
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
            .eq('id', location.state.chatId)
            .single();

          if (error) throw error;

          if (chat) {
            setSelectedChat(chat);
            navigate(location.pathname, { replace: true });
            
            // Scroll to bottom with a slight delay to ensure messages are rendered
            setTimeout(() => {
              scrollToBottom(true);
            }, 100);
          }
        } catch (error) {
          console.error('Error loading chat:', error);
          toast({
            title: "Error",
            description: "Failed to load chat conversation",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (currentUserId) {
      initializeChat();
    }
  }, [location.state?.chatId, navigate, currentUserId]);

  // New useEffect to scroll to the bottom when messages update
  useEffect(() => {
    // If a chat is selected and has messages, scroll to bottom after a delay
    if (selectedChat && selectedChat.messages && selectedChat.messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 200); // Adjust the delay if necessary
      return () => clearTimeout(timer);
    }
  }, [selectedChat, selectedChat?.messages?.length]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedChat?.id || !currentUserId) return;

    const channel = supabase
      .channel(`chat:${selectedChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${selectedChat.id}`,
      }, async (payload) => {
        try {
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          setSelectedChat(prev => ({
            ...prev,
            messages: [...(prev.messages || []), { ...payload.new, sender }],
          }));

          const isFromCurrentUser = payload.new.sender_id === currentUserId;
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          const isAtBottom = scrollContainer && 
            Math.abs((scrollContainer.scrollHeight - scrollContainer.scrollTop) - scrollContainer.clientHeight) < 100;

          if (isFromCurrentUser || isAtBottom) {
            scrollToBottom();
          }

          // Mark message as read if we're the receiver and viewing the chat
          if (!isFromCurrentUser) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          }
        } catch (error) {
          console.error('Error processing new message:', error);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChat?.id, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUserId,
          content: message.trim(),
          read: false,
        });

      if (messageError) throw messageError;

      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = async (chat: any, hasUnread = false) => {
    setSelectedChat(chat);
    setHasUnreadMessages(hasUnread);

    try {
      if (hasUnread) {
        setTimeout(() => scrollToFirstUnread(chat.id), 100);
      } else {
        scrollToBottom(true);
      }

      // Mark all unread messages as read
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chat.id)
        .eq('read', false)
        .neq('sender_id', currentUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r flex flex-col bg-background">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateChat(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <ChatList
            selectedChat={selectedChat}
            onSelectChat={handleChatSelect}
          />
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedChat.type === 'group' ? selectedChat.name : 'Individual Chat'}
              </h3>
              {selectedChat.type === 'group' && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Users className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Group Members</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      {selectedChat.chat_participants.map((participant: any) => (
                        <div key={participant.profiles.id} className="py-2">
                          {participant.profiles.full_name}
                        </div>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
            {selectedChat.type === 'group' && (
              <p className="text-sm text-muted-foreground">{selectedChat.area}</p>
            )}
          </div>

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <MessageList chatId={selectedChat.id} currentUserId={currentUserId} />
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <>
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Chat Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a chat from the sidebar or create a new one
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <CreateChatDialog
        open={showCreateChat}
        onOpenChange={setShowCreateChat}
        onChatCreated={setSelectedChat}
      />
    </div>
  );
}
