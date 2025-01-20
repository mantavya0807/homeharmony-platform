import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function CreateChatDialog({ open, onOpenChange, onChatCreated }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatType, setChatType] = useState('individual');
  const [selectedUser, setSelectedUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupArea, setGroupArea] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const searchUsers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${term}%`)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data);
  };

  const createIndividualChat = async () => {
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user to chat with',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if chat already exists
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*, chat_participants(*)')
        .eq('type', 'individual');

      const existingChat = existingChats?.find(chat =>
        chat.chat_participants.some(p => p.user_id === selectedUser) &&
        chat.chat_participants.some(p => p.user_id === user.id)
      );

      if (existingChat) {
        onChatCreated(existingChat);
        onOpenChange(false);
        return;
      }

      // Create new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'individual',
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: user.id },
          { chat_id: chat.id, user_id: selectedUser },
        ]);

      if (participantsError) throw participantsError;

      onChatCreated(chat);
      onOpenChange(false);
      toast({
        title: 'Success',
        description: 'Chat created successfully',
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createGroupChat = async () => {
    if (!groupName || !groupArea) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create group chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'group',
          name: groupName,
          area: groupArea,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      onChatCreated(chat);
      onOpenChange(false);
      toast({
        title: 'Success',
        description: 'Group chat created successfully',
      });
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="individual" onValueChange={setChatType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>
          <TabsContent value="individual" className="space-y-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <Input
                placeholder="Type to search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        setSelectedUser(user.id);
                        setSearchTerm(user.full_name);
                        setSearchResults([]);
                      }}
                    >
                      {user.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              disabled={isLoading}
              onClick={createIndividualChat}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Chat
            </Button>
          </TabsContent>
          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input
                placeholder="e.g., State College"
                value={groupArea}
                onChange={(e) => setGroupArea(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={isLoading}
              onClick={createGroupChat}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}