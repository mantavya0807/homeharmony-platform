import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MessageSquare, Users, Plus, Send } from 'lucide-react';
import { ChatList } from './ChatList';
import { MessageList } from './MessageList';
import { CreateChatDialog } from './CreateChatDialog';

export function ChatInterface() {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: message.trim(),
        });

      if (error) throw error;
      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
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
            onSelectChat={setSelectedChat}
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
                    {/* Add group members list here */}
                  </SheetContent>
                </Sheet>
              )}
            </div>
            {selectedChat.type === 'group' && (
              <p className="text-sm text-muted-foreground">{selectedChat.area}</p>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            <MessageList chatId={selectedChat.id} />
            <div ref={messagesEndRef} />
          </ScrollArea>

          <form onSubmit={sendMessage} className="p-4 border-t flex gap-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Chat Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a chat from the sidebar or create a new one
            </p>
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