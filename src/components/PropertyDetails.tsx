import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

// UI & Components
import { Button } from "@/components/ui/button";
import { PaymentButton } from "./PaymentButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  MessagesSquare,
  Home,
  ArrowLeft,
  Loader2,
  Star,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { VerificationDetails } from "./VerificationDetails";
import { useSavedStatus } from "@/hooks/useSavedStatus";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// -----------------------//
// Helper Components
// -----------------------//

// Duration Display Component
const DurationDisplay = ({ months }: { months: number }) => {
  return (
    <motion.div
      className="w-full rounded-lg bg-muted/20 p-6 flex flex-col items-center justify-center space-y-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.2,
      }}
    >
      <motion.div
        className="text-4xl font-bold text-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.4,
        }}
      >
        {months}
      </motion.div>
      <motion.div
        className="text-sm text-muted-foreground"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5,
        }}
      >
        {months === 1 ? "month" : "months"} sublease
      </motion.div>
    </motion.div>
  );
};

// WalkscoreWidget Component
const WalkscoreWidget: React.FC<{ address: string }> = ({ address }) => {
  const { theme } = useTheme();

  useEffect(() => {
    (window as any).ws_wsid = "g6a58aea38a124a729e3e228de2412943";
    (window as any).ws_address = address;
    (window as any).ws_format = "rectangle";
    (window as any).ws_width = "300";
    (window as any).ws_height = "300";
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
      if (tileDiv) {
        tileDiv.innerHTML = "";
      }
    };
  }, [address, theme]);

  return (
    <div id="ws-walkscore-tile" className="dark:bg-card rounded-lg" />
  );
};

// A small helper component to display images in a grid
const ImagesGrid: React.FC<{ images: string[]; categoryLabel: string }> = ({
  images,
  categoryLabel,
}) => {
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

// -----------------------//
// Interfaces
// -----------------------//

interface HousingComplex {
  id: string;
  name: string;
}

interface SellerProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  // Remove rating/review_count/etc if they do not exist in your DB:
  // rating?: number;
  // review_count?: number;
}

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
  seller: SellerProfile; // renamed to match the interface above
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

  // State: property info
  const [property, setProperty] = useState<Property | null>(null);
  // State: property images from `property_media`
  const [propertyMedia, setPropertyMedia] = useState<PropertyMedia | null>(null);
  // State: loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State: contact button
  const [contactLoading, setContactLoading] = useState(false);

  // Saved status hook
  const { isSaved, loading: savingLoading, toggleSave } = useSavedStatus(id!);

  // User role
  const [userRole, setUserRole] = useState<string | null>(null);

  // Verification details
  const [verification, setVerification] = useState<Verification | null>(null);

  // -----------------------//
  // Fetch property (remove rating/review_count if not in DB)
  // -----------------------//
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select(`
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
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) {
          setError("Property not found");
          return;
        }

        // For demo, set any verification details
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

  // -----------------------//
  // Fetch user role from "profiles" table
  // -----------------------//
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

  // -----------------------//
  // Fetch property media
  // -----------------------//
  useEffect(() => {
    const fetchPropertyMedia = async () => {
      if (!id) return;

      try {
        // Use .maybeSingle() so we don't get an error if 0 rows
        const { data, error } = await supabase
          .from("property_media")
          .select("*")
          .eq("property_id", id)
          .maybeSingle(); // returns data or null (no error)

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

  // -----------------------//
  // Contact Agent
  // -----------------------//
  const handleContactAgent = async () => {
    try {
      setContactLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        navigate("/auth");
        return;
      }

      if (!property?.seller_id) {
        throw new Error("Seller information not found");
      }

      // Check if chat already exists
      const { data: existingChats, error: chatError } = await supabase
        .from("chats")
        .select("*, chat_participants(*)")
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
        // Create new chat
        const { data: chat, error: chatCreateError } = await supabase
          .from("chats")
          .insert({ type: "individual" })
          .select()
          .single();

        if (chatCreateError) throw chatCreateError;

        // Add participants
        const { error: participantsError } = await supabase
          .from("chat_participants")
          .insert([
            { chat_id: chat.id, user_id: user.id },
            { chat_id: chat.id, user_id: property.seller_id },
          ]);
        if (participantsError) throw participantsError;

        // Send initial message
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

  // -----------------------//
  // Save Property
  // -----------------------//
  const handleSaveClick = async () => {
    try {
      await toggleSave();
    } catch (error: any) {
      console.error("Error saving property:", error);
    }
  };

  // -----------------------//
  // Sublease Duration
  // -----------------------//
  const getSubLeaseDuration = () => {
    if (!property?.sublease_from || !property?.sublease_to) return null;

    const start = new Date(property.sublease_from);
    const end = new Date(property.sublease_to);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  };

  // -----------------------//
  // Payment Section
  // -----------------------//
  const renderPaymentSection = () => {
    if (!property || userRole !== "buyer") return null;

    const basePrice = property.price;
    const platformFee = property.price * 0.05;
    const total = basePrice + platformFee;

    return (
      <div className="mt-8 p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Purchase this Property</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Price</span>
            <span className="font-semibold">${basePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Fee (5%)</span>
            <span className="font-semibold">${platformFee.toLocaleString()}</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <PaymentButton
            propertyId={property.id}
            sellerId={property.seller_id}
            amount={total}
            onSuccess={() => navigate("/dashboard")}
          />

          <p className="text-xs text-muted-foreground mt-4">
            By clicking the button above, you agree to our terms of service and
            payment processing policies.
          </p>
        </div>
      </div>
    );
  };

  // -----------------------//
  // Render
  // -----------------------//

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
    <>
      <div className="min-h-screen bg-background">
        {/* Top Section: Image + Back Button */}
        <div className="relative h-[50vh] bg-black">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          {/* Main cover image (if exists) */}
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title & Address */}
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{fullAddress}</span>
                </div>
                {property.housing_complex?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Home className="h-4 w-4" />
                    <span>Complex: {property.housing_complex.name}</span>
                  </div>
                )}
              </div>

              {/* Verification Details */}
              {verification && (
                <VerificationDetails
                  isVerified={verification.is_verified}
                  leaseInfo={verification.leaseInfo}
                />
              )}

              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms} Bedrooms</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms} Bathrooms</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      <span>{property.square_feet} sqft</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>{property.property_type}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sublease Info */}
              {property.sublease_from && property.sublease_to && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Sublease Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <motion.div
                        className="flex items-center justify-between"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div>
                          <p className="text-sm text-muted-foreground">From</p>
                          <p className="font-medium">
                            {new Date(property.sublease_from).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">To</p>
                          <p className="font-medium">
                            {new Date(property.sublease_to).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                      <DurationDisplay months={getSubLeaseDuration() || 0} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property Description */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{property.description}</p>
                </CardContent>
              </Card>

              {/* Categorized Images (Tabs) */}
              {propertyMedia && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                    <CardDescription>
                      Explore property images by category
                    </CardDescription>
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
                          categoryLabel="bedroom"
                        />
                      </TabsContent>
                      <TabsContent value="living_room">
                        <ImagesGrid
                          images={propertyMedia.living_room || []}
                          categoryLabel="living room"
                        />
                      </TabsContent>
                      <TabsContent value="bathroom">
                        <ImagesGrid
                          images={propertyMedia.bathroom || []}
                          categoryLabel="bathroom"
                        />
                      </TabsContent>
                      <TabsContent value="kitchen">
                        <ImagesGrid
                          images={propertyMedia.kitchen || []}
                          categoryLabel="kitchen"
                        />
                      </TabsContent>
                      <TabsContent value="floorplan">
                        <ImagesGrid
                          images={propertyMedia.floorplan || []}
                          categoryLabel="floorplan"
                        />
                      </TabsContent>
                      <TabsContent value="other">
                        <ImagesGrid
                          images={propertyMedia.other || []}
                          categoryLabel="other"
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Location & Walkscore */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Location Card */}
                <Card className="shadow-sm p-3">
                  <CardHeader className="pb-2">
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative rounded-lg overflow-hidden">
                      <iframe
                        className="w-full h-[300px] border-0 dark:invert-[.9] dark:hue-rotate-180"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I&q=${encodeURIComponent(
                          fullAddress
                        )}&zoom=15`}
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          fullAddress
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Get Directions</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* Walkscore Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle>Walkscore</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <WalkscoreWidget address={fullAddress} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column / Sidebar */}
            <div className="space-y-6">
              {/* Price */}
              <Card className="shadow-sm">
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

              {/* Agent Details + Contact */}
              <Card className="shadow-sm">
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
                      "bg-primary hover:bg-primary/90"
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
                  isSaved
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary hover:bg-primary/90"
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

          {/* Payment Section (only if userRole === 'buyer') */}
          {renderPaymentSection()}
        </div>
      </div>

      {/* Seller Section: Enhanced UI */}
      {property.seller && (
        <Card className="mt-4 shadow-sm container mx-auto">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              {/* Seller Avatar + Info */}
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
                  <CardTitle className="text-lg">
                    {property.seller.full_name}
                  </CardTitle>

                  {/* If you had rating or review_count, you could place them here */}
                  {/* Example:
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1">
                        4.8 (123 reviews)
                      </span>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Buttons (Message & View Profile) */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/chat`, { state: { sellerId: property.seller.id } })
                  }
                >
                  <MessagesSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button onClick={() => navigate(`/seller/${property.seller.id}`)}>
                  View Profile
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="py-4">
            {property.seller.bio && (
              <p className="text-muted-foreground mb-4">{property.seller.bio}</p>
            )}
            {/* If you do have a response_time column, show it here:
            {property.seller.response_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Usually responds within {property.seller.response_time}</span>
              </div>
            )} */}
          </CardContent>
        </Card>
      )}
    </>
  );
}
