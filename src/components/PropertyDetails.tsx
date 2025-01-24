import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  images: string[];
  created_at: string;
  seller_id: string;
  seller: {
    id: string;
    full_name: string;
  };
}

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select(`
            *,
            seller:seller_id (
              id,
              full_name
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleContactAgent = async () => {
    try {
      setContactLoading(true);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to contact the agent",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      if (!property?.seller_id) {
        throw new Error("Seller information not found");
      }

      // Check if chat already exists
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*, chat_participants(*)')
        .eq('type', 'individual');

      const existingChat = existingChats?.find(chat =>
        chat.chat_participants.some(p => p.user_id === property.seller_id) &&
        chat.chat_participants.some(p => p.user_id === user.id)
      );

      let chatId;

      if (existingChat) {
        chatId = existingChat.id;
      } else {
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
            { chat_id: chat.id, user_id: property.seller_id },
          ]);

        if (participantsError) throw participantsError;

        // Send initial message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chat.id,
            sender_id: user.id,
            content: `Hi, I'm interested in your property: ${property.title} at ${property.address}, ${property.city}`,
          });

        if (messageError) throw messageError;

        chatId = chat.id;
      }

      // Navigate to chat
      navigate('/chat', { state: { chatId } });
    } catch (error) {
      console.error('Error contacting agent:', error);
      toast({
        title: "Error",
        description: "Failed to initiate chat with the agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-muted-foreground mb-4">{error || "Property not found"}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Image Gallery */}
      <div className="relative h-[50vh] bg-black">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zip_code}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>{property.bedrooms} Bedrooms</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    <span>{property.bathrooms} Bathrooms</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    <span>{property.square_feet} sqft</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>{property.property_type}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{property.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Price</CardTitle>
                <CardDescription>Property listed on {new Date(property.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${property.price.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Listed by: {property.seller?.full_name || "Unknown Agent"}
                </p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleContactAgent}
                  disabled={contactLoading}
                >
                  {contactLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Contact Agent"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}