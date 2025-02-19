import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

// UI Components & Icons
import { Button } from "@/components/ui/button";
import { PaymentButton } from "./PaymentButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Custom Components
import { VerificationDetails } from "./VerificationDetails";
import { useSavedStatus } from "@/hooks/useSavedStatus";
import { ComplexCard } from "./ComplexCard";

// -----------------------//
// Helper Components
// -----------------------//

const ImagesGrid: React.FC<{
  images: string[];
  categoryLabel: string;
}> = ({ images, categoryLabel }) => {
  if (!images || images.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No {categoryLabel} images available.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {images.map((src, idx) => (
        <div
          key={idx}
          className="relative w-full h-48 sm:h-64 md:h-72 bg-muted overflow-hidden rounded-lg"
        >
          <img
            src={src}
            alt={`${categoryLabel} ${idx + 1}`}
            className="object-cover w-full h-full"
          />
        </div>
      ))}
    </div>
  );
};

const WalkscoreWidget: React.FC<{ address: string }> = ({ address }) => {
  const { theme } = useTheme();
  useEffect(() => {
    (window as any).ws_wsid = "g6a58aea38a124a729e3e228de2412943";
    (window as any).ws_address = address;
    (window as any).ws_format = "horizontal";
    (window as any).ws_width = "100%";
    (window as any).ws_height = "100";
    (window as any).ws_theme = theme === "dark" ? "dark" : "light";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.walkscore.com/tile/show-walkscore-tile.php";
    script.async = true;

    const tileDiv = document.getElementById("ws-walkscore-tile");
    if (tileDiv) {
      tileDiv.innerHTML = "";
      tileDiv.appendChild(script);
    }
    return () => {
      if (tileDiv) tileDiv.innerHTML = "";
    };
  }, [address, theme]);

  return <div id="ws-walkscore-tile" className="w-full" />;
};

// -----------------------//
// Interfaces
// -----------------------//

interface HousingComplex {
  id: string;
  name: string;
  // ... add any additional fields as needed
}

interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

export interface Property {
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
  seller: SellerProfile;
  housing_complex_id: string | null;
  housing_complex?: HousingComplex;
  sublease_from?: string;
  sublease_to?: string;
  is_verified?: boolean;
  original_lease_rent?: number;
  original_lease_term?: number;
  rent_differential?: number;
}

interface PropertyMedia {
  id: string;
  property_id: string;
  bedroom: string[] | null;
  living_room: string[] | null;
  bathroom: string[] | null;
  kitchen: string[] | null;
  floorplan: string[] | null;
  other: string[] | null;
  created_at: string;
}

interface Verification {
  is_verified: boolean;
  leaseInfo?: {
    originalRent?: number;
    leaseTerm?: number | null;
    startDate?: string;
    endDate?: string;
    rentDifferential?: number | null;
  };
}

// -----------------------//
// Main Component
// -----------------------//

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // State variables
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyMedia, setPropertyMedia] = useState<PropertyMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);

  // Saved status hook
  const { isSaved, loading: savingLoading, toggleSave } = useSavedStatus(id!);

  // Fetch property details
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
              full_name,
              avatar_url,
              bio
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
        if (!data) {
          setError("Property not found");
          return;
        }
        setVerification({
          is_verified: data.is_verified,
          leaseInfo: {
            originalRent: data.original_lease_rent,
            leaseTerm: data.original_lease_term,
            startDate: data.sublease_from,
            endDate: data.sublease_to,
            rentDifferential: data.rent_differential,
          },
        });
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

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch property media
  useEffect(() => {
    const fetchPropertyMedia = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("property_media")
          .select("*")
          .eq("property_id", id)
          .maybeSingle();
        if (error) {
          console.warn("Error fetching property media:", error.message);
        }
        if (data) {
          setPropertyMedia(data);
        }
      } catch (err: any) {
        console.error("Error fetching property images:", err);
      }
    };
    fetchPropertyMedia();
  }, [id]);

  const handleContactAgent = async () => {
    try {
      setContactLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!property?.seller_id) throw new Error("Seller information not found");

      const { data: existingChats, error: chatError } = await supabase
        .from("chats")
        .select(", chat_participants()")
        .eq("type", "individual");
      if (chatError) throw chatError;

      const existingChat = existingChats?.find(
        (chat: any) =>
          chat.chat_participants.some((p: any) => p.user_id === property.seller_id) &&
          chat.chat_participants.some((p: any) => p.user_id === user.id)
      );

      let chatId;
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const { data: chat, error: chatCreateError } = await supabase
          .from("chats")
          .insert({ type: "individual" })
          .select()
          .single();
        if (chatCreateError) throw chatCreateError;

        const { error: participantsError } = await supabase
          .from("chat_participants")
          .insert([
            { chat_id: chat.id, user_id: user.id },
            { chat_id: chat.id, user_id: property.seller_id },
          ]);
        if (participantsError) throw participantsError;

        const { error: messageError } = await supabase.from("messages").insert({
          chat_id: chat.id,
          sender_id: user.id,
          content: `Hi, I'm interested in your property: ${property.title} at ${property.address}, ${property.city}`,
        });
        if (messageError) throw messageError;

        chatId = chat.id;
      }
      navigate("/chat", { state: { chatId } });
    } catch (error: any) {
      console.error("Error contacting agent:", error);
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

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Section: Back Button and Title */}
      <div className="p-4 flex items-center">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="icon"
          className="mr-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-4xl font-bold">{property.title}</h1>
      </div>

      {/* Main Grid Layout */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side: cover image, property details, category-based gallery if desired */}
        <div className="lg:col-span-3 space-y-6">
          {/* Cover Image */}
          <div className="w-full h-[50vh] relative">
            {property.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                <Home className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Property Features */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  <span>{property.square_feet} sqft</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>{property.property_type}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {property.description}
                </p>
              </div>
              {verification && (
                <div className="mt-4">
                  <VerificationDetails
                    isVerified={verification.is_verified}
                    leaseInfo={verification.leaseInfo}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category-based Gallery (if you still want to keep it) */}
          {propertyMedia && (
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
                <CardDescription>Browse images by category</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bedroom">
                  <TabsList className="flex flex-wrap">
                    <TabsTrigger value="bedroom">Bedroom</TabsTrigger>
                    <TabsTrigger value="living_room">Living Room</TabsTrigger>
                    <TabsTrigger value="bathroom">Bathroom</TabsTrigger>
                    <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
                    <TabsTrigger value="floorplan">Floorplan</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>
                  <TabsContent value="bedroom">
                    <ImagesGrid
                      images={propertyMedia.bedroom || []}
                      categoryLabel="Bedroom"
                    />
                  </TabsContent>
                  <TabsContent value="living_room">
                    <ImagesGrid
                      images={propertyMedia.living_room || []}
                      categoryLabel="Living Room"
                    />
                  </TabsContent>
                  <TabsContent value="bathroom">
                    <ImagesGrid
                      images={propertyMedia.bathroom || []}
                      categoryLabel="Bathroom"
                    />
                  </TabsContent>
                  <TabsContent value="kitchen">
                    <ImagesGrid
                      images={propertyMedia.kitchen || []}
                      categoryLabel="Kitchen"
                    />
                  </TabsContent>
                  <TabsContent value="floorplan">
                    <ImagesGrid
                      images={propertyMedia.floorplan || []}
                      categoryLabel="Floorplan"
                    />
                  </TabsContent>
                  <TabsContent value="other">
                    <ImagesGrid
                      images={propertyMedia.other || []}
                      categoryLabel="Other"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side: Complex card, seller info, payment card */}
        <div className="lg:col-span-1 space-y-6">
          {property.housing_complex && (
            <ComplexCard
              complex={{
                ...property.housing_complex,
                reviews: property.housing_complex.reviews || [],
                average_rating: property.housing_complex.average_rating ?? 0,
              }}
              userRole={userRole}
              onSelect={() => {}}
            />
          )}

          {/* Seller Details */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={property.seller.avatar_url}
                    alt={property.seller.full_name}
                  />
                  <AvatarFallback>
                    {property.seller.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">
                    {property.seller.full_name}
                  </h3>
                  {property.seller.bio && (
                    <p className="text-sm text-muted-foreground">
                      {property.seller.bio}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={handleContactAgent}
                className="w-full py-3 px-4 rounded-lg bg-primary text-white font-semibold flex items-center justify-center transition-colors hover:bg-primary/90"
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
              <motion.button
                onClick={handleSaveClick}
                className={cn(
                  "w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center transition-colors",
                  isSaved
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary hover:bg-primary/90"
                )}
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
            </CardContent>
          </Card>

          {/* Payment Section (visible to buyers) */}
          {userRole === "buyer" && (
            <Card className="border">
              <CardHeader>
                <CardTitle>Purchase this Property</CardTitle>
                <CardDescription>
                  Listed on {new Date(property.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Price</span>
                    <span className="font-semibold">
                      ${property.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee (5%)</span>
                    <span className="font-semibold">
                      ${(property.price * 0.05).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(property.price * 1.05).toLocaleString()}</span>
                  </div>
                  <PaymentButton
                    propertyId={property.id}
                    sellerId={property.seller_id}
                    amount={property.price * 1.05}
                    onSuccess={() => navigate("/dashboard")}
                  />
                  <p className="text-xs text-muted-foreground mt-4">
                    By clicking the button above, you agree to our terms of
                    service and payment processing policies.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Full-Width Gallery Section (combining all images) */}
      {propertyMedia && (
        <section className="container mx-auto px-4 py-6">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Property Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ...new Set([
                ...(propertyMedia.bedroom || []),
                ...(propertyMedia.living_room || []),
                ...(propertyMedia.bathroom || []),
                ...(propertyMedia.kitchen || []),
                ...(propertyMedia.floorplan || []),
                ...(propertyMedia.other || []),
              ]),
            ].map((src, idx) => (
              <div key={idx} className="overflow-hidden rounded-lg">
                <img
                  src={src}
                  alt={`Property image ${idx + 1}`}
                  className="w-full h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New Full-Width Location Section */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="map">
              <TabsList className="flex">
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="walkscore">Walk Score</TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <div className="relative h-[500px] w-full rounded-lg overflow-hidden">
                  <iframe
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I&q=${encodeURIComponent(
                      fullAddress
                    )}&zoom=15`}
                    allowFullScreen
                  />
                </div>
              </TabsContent>
              <TabsContent value="walkscore">
                <div className="relative h-[500px] w-full">
                  <WalkscoreWidget address={fullAddress} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
