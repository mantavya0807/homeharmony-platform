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
import { MessageSquare, Users, Send, Loader2 } from 'lucide-react';
import { ChatList } from './ChatList';
import { MessageList } from './MessageList';
import { useToast } from '@/components/ui/use-toast';
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export function ChatInterface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Mouse tracking for glow effect
  const chatRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (chatRef.current) {
        const rect = chatRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    
    const darkGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;
    
    return {
      background: theme === 'dark' ? darkGlow : lightGlow,
      opacity: 0.7,
    };
  };

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
            setTimeout(() => scrollToBottom(true), 100);
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
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      ref={chatRef}
      className="pt-16" // Add padding top to account for navigation bar
    >
      <div className="h-[calc(100vh-4rem)] relative flex bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
        <div 
          className="pointer-events-none absolute inset-0 transition-opacity duration-300" 
          style={getGlowStyles()} 
        />
        
        {/* Chat Layout */}
        <div className="relative w-full flex">
          {/* Sidebar with Chat List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 border-r flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-sm"
          >
            <h2 className="p-4 font-semibold text-xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
              Messages
            </h2>
            <ScrollArea className="flex-1">
              <ChatList
                selectedChat={selectedChat}
                onSelectChat={(chat, hasUnread) => {
                  setSelectedChat(chat);
                  setHasUnreadMessages(hasUnread);
                }}
              />
            </ScrollArea>
          </motion.div>

          {/* Main Chat Area */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-sm"
          >
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-blue-100 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 dark:text-white">
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

                <form 
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-blue-100 dark:border-white/10 flex gap-4"
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/50 dark:bg-black/20 border-blue-100 dark:border-white/10 focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!message.trim()}
                    className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold text-blue-900 dark:text-white">
                        No Chat Selected
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Select a chat from the sidebar to start messaging
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}