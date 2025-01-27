import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyCard } from "@/components/PropertyCard1";
import { EditPropertyDialog } from "@/pages/EditPropertyDialog";
import AddHousingComplex from "@/components/AddHousingComplex";

// Import the new AddressInput component
import { AddressInput } from "@/components/AddressInput";

import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = Database["public"]["Tables"]["housing_complexes"]["Row"];

interface PropertyForm {
  title: string;
  description: string;
  price: string;
  property_type: "house" | "apartment" | "condo" | "townhouse";
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  housing_complex_id?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [addComplexOpen, setAddComplexOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [housingComplexes, setHousingComplexes] = useState<HousingComplex[]>([]);
  const [loadingHousingComplexes, setLoadingHousingComplexes] = useState(true);

  const [newProperty, setNewProperty] = useState<PropertyForm>({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    property_type: "house",
    housing_complex_id: "",
  });

  useEffect(() => {
    fetchProperties();
    fetchHousingComplexes();
  }, [navigate]);

  const fetchProperties = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "seller") {
        navigate("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHousingComplexes = async () => {
    try {
      const { data, error } = await supabase
        .from("housing_complexes")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setHousingComplexes(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      });
    } finally {
      setLoadingHousingComplexes(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Each file must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      const type = file.type.startsWith("image/") ? "image" : "video";
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (propertyId: string) => {
    const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
      try {
        const fileExt = mediaFile.file.name.split(".").pop();
        const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;

        // Remove existing files in that folder to avoid clutter
        const { data: existingFiles } = await supabase.storage
          .from("property-media")
          .list(`${propertyId}`);

        if (existingFiles?.length) {
          const filesToRemove = existingFiles.map(
            (file) => `${propertyId}/${file.name}`
          );
          await supabase.storage.from("property-media").remove(filesToRemove);
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from("property-media")
          .upload(fileName, mediaFile.file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("property-media")
          .getPublicUrl(fileName);

        return data.publicUrl;
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            ...newProperty,
            price: parseFloat(newProperty.price),
            bedrooms: parseInt(newProperty.bedrooms),
            bathrooms: parseInt(newProperty.bathrooms),
            square_feet: parseInt(newProperty.square_feet),
            seller_id: session.user.id,
            images: [],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create property");

      const mediaUrls = await uploadMedia(data.id);

      const { error: updateError } = await supabase
        .from("properties")
        .update({ images: mediaUrls })
        .eq("id", data.id);

      if (updateError) throw updateError;

      setProperties((prev) => [{ ...data, images: mediaUrls }, ...prev]);
      resetForm();
      setOpen(false);
      toast({
        title: "Success",
        description: "Property listed successfully",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image",
        variant: "destructive",
      });
      return false;
    }

    const required = [
      "title",
      "description",
      "price",
      "address",
      "city",
      "state",
      "zip_code",
      "bedrooms",
      "bathrooms",
      "square_feet",
      "property_type",
    ];

    for (const field of required) {
      if (!newProperty[field as keyof PropertyForm]) {
        toast({
          title: "Error",
          description: `${field.replace("_", " ")} is required`,
          variant: "destructive",
        });
        return false;
      }
    }

    if (!/^\d{5}$/.test(newProperty.zip_code)) {
      toast({
        title: "Error",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setNewProperty({
      title: "",
      description: "",
      price: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      bedrooms: "",
      bathrooms: "",
      square_feet: "",
      property_type: "house",
      housing_complex_id: "",
    });
    setMediaFiles([]);
  };

  const handleAddComplex = (newComplex: HousingComplex) => {
    setHousingComplexes((prev) => [...prev, newComplex]);
    setNewProperty((prev) => ({ ...prev, housing_complex_id: newComplex.id }));
  };

  if (loading || loadingHousingComplexes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Enter the details of your property listing.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[calc(90vh-8rem)] px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Media Upload Section */}
                <div className="space-y-4">
                  <Label>Property Media</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type === "image" ? (
                          <img
                            src={file.preview}
                            alt={`Preview ${index}`}
                            className="h-24 w-full object-cover rounded-lg border"
                          />
                        ) : (
                          <video
                            src={file.preview}
                            className="h-24 w-full object-cover rounded-lg border"
                            controls
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Upload
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload images or videos (max 10MB each)
                  </p>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newProperty.title}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProperty.description}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your property..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  {/* Housing Complex Section */}
                  <div className="space-y-2">
                    <Label htmlFor="housing_complex">Housing Complex</Label>
                    <select
                      className="border rounded p-2 w-full"
                      value={newProperty.housing_complex_id || ""}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setAddComplexOpen(true);
                          setNewProperty({
                            ...newProperty,
                            housing_complex_id: "",
                          });
                        } else {
                          setNewProperty({
                            ...newProperty,
                            housing_complex_id: e.target.value,
                          });
                        }
                      }}
                    >
                      <option value="">Select a complex (optional)</option>
                      {housingComplexes.map((complex) => (
                        <option key={complex.id} value={complex.id}>
                          {complex.name}
                        </option>
                      ))}
                      <option value="new">+ Add New Complex</option>
                    </select>
                  </div>
                </div>

                {/* Address Information Section */}
                <AddressInput
                  address={newProperty.address}
                  city={newProperty.city}
                  state={newProperty.state}
                  zipCode={newProperty.zip_code}
                  onAddressChange={(address) =>
                    setNewProperty((prev) => ({ ...prev, address }))
                  }
                  onCityChange={(city) =>
                    setNewProperty((prev) => ({ ...prev, city }))
                  }
                  onStateChange={(state) =>
                    setNewProperty((prev) => ({ ...prev, state }))
                  }
                  onZipCodeChange={(zip) =>
                    setNewProperty((prev) => ({ ...prev, zip_code: zip }))
                  }
                />

                {/* Property Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProperty.price}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type</Label>
                    <select
                      className="border rounded p-2 w-full"
                      id="property_type"
                      value={newProperty.property_type}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          property_type: e.target.value as
                            | "house"
                            | "apartment"
                            | "condo"
                            | "townhouse",
                        })
                      }
                    >
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="1"
                      value={newProperty.bedrooms}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          bedrooms: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="1"
                      step="0.5"
                      value={newProperty.bathrooms}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          bathrooms: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="square_feet">Square Feet</Label>
                    <Input
                      id="square_feet"
                      type="number"
                      min="1"
                      value={newProperty.square_feet}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          square_feet: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    "Create Listing"
                  )}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <AddHousingComplex
        isOpen={addComplexOpen}
        onClose={() => setAddComplexOpen(false)}
        onAdd={handleAddComplex}
      />

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-6 rounded-full bg-primary/10 text-primary">
              <ImageIcon className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold">No Properties Listed</h2>
            <p className="text-muted-foreground max-w-sm">
              Start by adding your first property listing. Click the "Add New
              Property" button above to get started.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Property
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div key={property.id} className="group relative">
              <PropertyCard
                id={property.id}
                title={property.title}
                price={property.price}
                location={`${property.city}, ${property.state}`}
                beds={property.bedrooms}
                baths={property.bathrooms}
                sqft={property.square_feet}
                imageUrl={
                  property.images?.[0] ||
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                }
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-lg">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingProperty(property);
                    setEditDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <EditPropertyDialog
                  isOpen={isEditDialogOpen && editingProperty?.id === property.id}
                  onClose={() => {
                    setEditDialogOpen(false);
                    setEditingProperty(null);
                  }}
                  property={editingProperty}
                  onUpdate={(updatedProperty) => {
                    setProperties((prev) =>
                      prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p))
                    );
                  }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from("properties")
                        .delete()
                        .eq("id", property.id);

                      if (error) throw error;

                      // Remove property media
                      await supabase.storage
                        .from("property-media")
                        .remove([`${property.id}`]);

                      setProperties((prev) =>
                        prev.filter((p) => p.id !== property.id)
                      );
                      toast({
                        title: "Success",
                        description: "Property deleted successfully",
                      });
                    } catch (error) {
                      console.error("Error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to delete property",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
