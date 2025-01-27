// PropertyDetails.tsx

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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSavedStatus } from "@/hooks/useSavedStatus"; // Import the custom hook
import { cn } from "@/lib/utils"; // Import cn utility for class names

// Define the HousingComplex interface
interface HousingComplex {
  id: string;
  name: string;
}

// Updated Property interface to include housing_complex
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
  google_maps_link?: string;
  housing_complex_id: string | null;
  housing_complex?: HousingComplex;
}

// WalkscoreWidget Component
const WalkscoreWidget: React.FC<{ address: string }> = ({ address }) => {
  useEffect(() => {
    // Set the global variables required by the Walkscore script
    (window as any).ws_wsid = 'g6a58aea38a124a729e3e228de2412943';
    (window as any).ws_address = address;
    (window as any).ws_format = 'square';
    (window as any).ws_width = '500';
    (window as any).ws_height = '500';

    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.walkscore.com/tile/show-walkscore-tile.php'; // Changed to HTTPS for security
    script.async = true;

    // Append the script to the walkscore-tile div
    const tileDiv = document.getElementById('ws-walkscore-tile');
    if (tileDiv) {
      tileDiv.innerHTML = ''; // Clear previous content
      tileDiv.appendChild(script);
    }

    // Cleanup: remove the script when component unmounts or address changes
    return () => {
      if (tileDiv) {
        tileDiv.innerHTML = '';
      }
    };
  }, [address]);

  return (
    <>
      <style type='text/css'>
        {`
          #ws-walkscore-tile { position: relative; text-align: left; }
          #ws-walkscore-tile * { float: none; }
        `}
      </style>
      <div id='ws-walkscore-tile'></div>
    </>
  );
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  // Use the custom hook for saved status
  const { isSaved, loading: savingLoading, toggleSave } = useSavedStatus(id!);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select(
            `
              *,
              seller:seller_id (
                id,
                full_name
              ),
              housing_complex:housing_complex_id (
                id,
                name
              )
            `
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.message || "Failed to load property details");
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
        navigate("/auth");
        return;
      }

      if (!property?.seller_id) {
        throw new Error("Seller information not found");
      }

      // Check if chat already exists
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select('*, chat_participants(*)')
        .eq('type', 'individual');

      if (chatError) throw chatError;

      const existingChat = existingChats?.find(chat =>
        chat.chat_participants.some((p: any) => p.user_id === property.seller_id) &&
        chat.chat_participants.some((p: any) => p.user_id === user.id)
      );

      let chatId;

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        // Create new chat
        const { data: chat, error: chatCreateError } = await supabase
          .from('chats')
          .insert({
            type: 'individual',
          })
          .select()
          .single();

        if (chatCreateError) throw chatCreateError;

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
    } catch (error: any) {
      console.error('Error contacting agent:', error);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSaveClick = async () => {
    try {
      await toggleSave();
    } catch (error: any) {
      console.error("Error saving property:", error);
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
        <p className="text-muted-foreground mb-4">
          {error || "Property not found"}
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Construct full address for Walkscore
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

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
            {/* Property Title and Address */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.address}, {property.city}, {property.state}{" "}
                  {property.zip_code}
                </span>
              </div>
              {/* Display Housing Complex Name if available */}
              {property.housing_complex?.name && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Home className="h-4 w-4" />
                  <span>Complex: {property.housing_complex.name}</span>
                </div>
              )}
            </div>

            {/* Property Features */}
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

            {/* Property Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{property.description}</p>
              </CardContent>
            </Card>

            {/* Walkscore Widget */}
            <Card>
              <CardHeader>
                <CardTitle>Walkscore</CardTitle>
              </CardHeader>
              <CardContent>
                <WalkscoreWidget address={fullAddress} />
              </CardContent>
            </Card>

            {/* Google Maps Section */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <iframe
                    className="w-full h-[300px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I&q=${encodeURIComponent(
                      fullAddress
                    )}&zoom=15`}
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="mt-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      fullAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle>Price</CardTitle>
                <CardDescription>
                  Property listed on{" "}
                  {new Date(property.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${property.price.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Agent Details */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Listed by: {property.seller?.full_name || "Unknown Agent"}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center transition-colors",
                    "bg-primary hover:bg-primary-dark"
                  )}
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
                </motion.button>
              </CardContent>
            </Card>

            {/* Save Property Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center transition-colors",
                isSaved ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary-dark"
              )}
              onClick={handleSaveClick}
              disabled={savingLoading}
            >
              {savingLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSaved ? (
                "Saved"
              ) : (
                "Save Property"
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
