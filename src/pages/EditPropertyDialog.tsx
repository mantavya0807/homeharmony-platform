import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import AddHousingComplex from "@/components/AddHousingComplex";
import { AddressInput } from "@/components/AddressInput";
import RoomTypeInput from "@/components/RoomTypeInput";
import { useTheme } from "next-themes";

const VERIFICATION_API_URL = "http://localhost:4000/api/verify-document";

interface VerificationResult {
  is_verified: boolean;
  score?: number;
  leaseInfo?: {
    originalRent?: number;
    rentDifferential?: number;
    leaseTerm?: string;
    startDate?: string;
    endDate?: string;
  };
}

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = Database["public"]["Tables"]["housing_complexes"]["Row"];

interface EditPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onUpdate: (updatedProperty: Property) => void;
}

interface PropertyForm
  extends Omit<
    Property,
    "price" | "bedrooms" | "bathrooms" | "square_feet" | "images"
  > {
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  verification_document?: File | null;
}

interface MediaFile {
  file: File;
  preview: string;
}

export const EditPropertyDialog = ({
  isOpen,
  onClose,
  property,
  onUpdate,
}: EditPropertyDialogProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();

  // Loading state for updates
  const [loading, setLoading] = useState(false);

  // Housing complexes data
  const [housingComplexes, setHousingComplexes] = useState<HousingComplex[]>([]);
  const [addComplexOpen, setAddComplexOpen] = useState(false);

  // Property form state
  const [updatedProperty, setUpdatedProperty] = useState<PropertyForm>({
    title: "",
    description: "",
    price: "",
    address: "",
    unit: "",
    city: "",
    state: "",
    zip_code: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    housing_complex_id: "",
    property_type: "house",
  });

  // Media
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);

  // Mouse position for glow effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const getGlowStyles = () => {
    const lightGlow = `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px,
      rgba(30, 64, 175, 0.15),
      rgba(59, 130, 246, 0.1),
      transparent)`;
    const darkGlow = `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px,
      rgba(66, 153, 225, 0.15),
      transparent)`;
    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: 0.7,
    };
  };

  // Fetch housing complexes and set initial property data
  useEffect(() => {
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
      }
    };

    if (isOpen) {
      fetchHousingComplexes();

      if (property) {
        setUpdatedProperty({
          title: property.title || "",
          description: property.description || "",
          price: property.price?.toString() || "",
          address: property.address || "",
          unit: property.unit || "",
          city: property.city || "",
          state: property.state || "",
          zip_code: property.zip_code || "",
          bedrooms: property.bedrooms?.toString() || "",
          bathrooms: property.bathrooms?.toString() || "",
          square_feet: property.square_feet?.toString() || "",
          housing_complex_id: property.housing_complex_id || "",
          property_type: property.property_type || "house",
        });
        setExistingMedia(property.images || []);
      } else {
        setUpdatedProperty({
          title: "",
          description: "",
          price: "",
          address: "",
          unit: "",
          city: "",
          state: "",
          zip_code: "",
          bedrooms: "",
          bathrooms: "",
          square_feet: "",
          housing_complex_id: "",
          property_type: "house",
        });
        setExistingMedia([]);
        setMediaFiles([]);
      }
    }
  }, [isOpen, property, toast]);

  // Handle adding a new housing complex
  const handleAddComplex = (newComplex: HousingComplex) => {
    setHousingComplexes((prev) => [...prev, newComplex]);
    setUpdatedProperty((prev) => ({ ...prev, housing_complex_id: newComplex.id }));
    setAddComplexOpen(false);
  };

  // Verification document handling
  const handleVerificationUpload = async (file: File) => {
    if (!property?.id) return;
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${property.id}/${timestamp}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-verifications")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("property-verifications")
        .getPublicUrl(filePath);

      await supabase
        .from("properties")
        .update({
          verification_document_url: publicUrlData.publicUrl,
          is_verified: false,
        })
        .eq("id", property.id);

      // Attempt external verification service (non-blocking)
      try {
        const propertyDetails = {
          address: updatedProperty.address,
          unit: updatedProperty.unit,
          city: updatedProperty.city,
          state: updatedProperty.state,
          zip_code: updatedProperty.zip_code,
          price: updatedProperty.price,
        };

        const formData = new FormData();
        formData.append("file", file);
        formData.append("propertyDetails", JSON.stringify(propertyDetails));

        const response = await fetch(VERIFICATION_API_URL, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Verification service error: ${response.status}`);
        }

        const verificationResult: VerificationResult = await response.json();
        await supabase
          .from("properties")
          .update({
            is_verified: verificationResult.is_verified,
            verified_at: verificationResult.is_verified ? new Date().toISOString() : null,
            original_lease_rent: verificationResult.leaseInfo?.originalRent || null,
            rent_differential: verificationResult.leaseInfo?.rentDifferential || null,
            original_lease_term: verificationResult.leaseInfo?.leaseTerm || null,
            sublease_from: verificationResult.leaseInfo?.startDate
              ? new Date(verificationResult.leaseInfo.startDate).toISOString()
              : null,
            sublease_to: verificationResult.leaseInfo?.endDate
              ? new Date(verificationResult.leaseInfo.endDate).toISOString()
              : null,
          })
          .eq("id", property.id);

        toast({
          title: "Verification Complete",
          description: verificationResult.is_verified
            ? "Document verified successfully"
            : "Document requires manual verification",
          variant: verificationResult.is_verified ? "default" : "warning",
        });
      } catch (verifyError) {
        console.error("Verification service error:", verifyError);
        toast({
          title: "Verification Service Unavailable",
          description: "Document uploaded but verification is currently unavailable",
          variant: "warning",
        });
      }
    } catch (error: any) {
      console.error("Error handling document:", error);
      toast({
        title: "Error",
        description: "Failed to upload verification document",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Main property update
  const handleEditProperty = async () => {
    if (!property?.id) {
      toast({
        title: "Error",
        description: "Invalid property ID",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);

      // Upload verification doc if present
      if (verificationDocument) {
        await handleVerificationUpload(verificationDocument);
      }

      // Validate or clear housing complex
      let validatedHousingComplexId: string | null = null;
      if (updatedProperty.housing_complex_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(updatedProperty.housing_complex_id)) {
          validatedHousingComplexId = updatedProperty.housing_complex_id;
        } else {
          toast({
            title: "Error",
            description: "Invalid Housing Complex ID",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const updatePayload = {
        title: updatedProperty.title,
        description: updatedProperty.description,
        price: parseFloat(updatedProperty.price) || 0,
        bedrooms: parseInt(updatedProperty.bedrooms) || 0,
        bathrooms: parseInt(updatedProperty.bathrooms) || 0,
        square_feet: parseInt(updatedProperty.square_feet) || 0,
        address: updatedProperty.address,
        unit: updatedProperty.unit,
        city: updatedProperty.city,
        state: updatedProperty.state,
        zip_code: updatedProperty.zip_code,
        property_type: updatedProperty.property_type,
        housing_complex_id: validatedHousingComplexId,
      };

      // Update property details
      const { error: updateError } = await supabase
        .from("properties")
        .update(updatePayload)
        .eq("id", property.id);
      if (updateError) throw updateError;

      // Handle new media uploads
      if (mediaFiles.length > 0) {
        const uploadedUrls = await uploadMedia(property.id);
        const updatedImages = [...existingMedia, ...uploadedUrls];
        const { error: mediaUpdateError } = await supabase
          .from("properties")
          .update({ images: updatedImages })
          .eq("id", property.id);
        if (mediaUpdateError) throw mediaUpdateError;
      }

      // Fetch updated property
      const { data: updatedPropertyData, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", property.id)
        .single();
      if (fetchError) throw fetchError;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      // Pass updated data to parent
      onUpdate(updatedPropertyData);
      onClose();
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload new media files
  const uploadMedia = async (propertyId: string) => {
    const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
      const fileExt = mediaFile.file.name.split(".").pop();
      const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(fileName, mediaFile.file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("property-media")
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    });
    return await Promise.all(uploadPromises);
  };

  // Handle file selection for media
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove selected new media
  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing media from storage and property record
  const removeExistingMedia = async (mediaUrl: string) => {
    try {
      const filePath = mediaUrl.split("/property-media/")[1];
      const { error } = await supabase.storage.from("property-media").remove([filePath]);
      if (error) throw error;
      setExistingMedia((prev) => prev.filter((url) => url !== mediaUrl));
      toast({
        title: "Success",
        description: "Media removed successfully",
      });
    } catch (error) {
      console.error("Error removing media:", error);
      toast({
        title: "Error",
        description: "Failed to remove media. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        {/* 
          NOTE: We use fixed positioning and manual transforms to center the dialog 
          in the viewport. Adjust max-w, max-h, and other classes to suit your design.
        */}
        <DialogContent
          onMouseMove={handleMouseMove}
          className="
            fixed
            top-1/2
            left-1/2
            w-full
            max-w-[800px]
            max-h-[90vh]
            transform
            -translate-x-1/2
            -translate-y-1/2
            overflow-y-auto
            shadow-xl
            rounded-lg
            p-6
            bg-gradient-to-b
            from-transparent
            via-background/50
            to-background
            border
            border-slate-200
            dark:border-slate-700
            z-50
          "
        >
          {/* The glow effect behind content */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={getGlowStyles()}
          />
          <div className="relative z-10">
            <DialogHeader className="mb-6 text-center">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
                Edit Property
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update the details of your property.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditProperty();
              }}
              className="space-y-6"
            >
              {/* Media Upload Section */}
              <div className="space-y-4">
                <Label>Property Media</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing media */}
                  {existingMedia.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Existing Media ${index}`}
                        className="h-24 w-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(url)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {/* New media */}
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={file.preview}
                        alt={`New Media ${index}`}
                        className="h-24 w-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {/* Media Upload Button */}
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
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

              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={updatedProperty.title}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, title: e.target.value })
                    }
                    required
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={updatedProperty.description}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, description: e.target.value })
                    }
                    className="min-h-[100px] rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Housing Complex Section */}
                <div className="space-y-2">
                  <Label htmlFor="housing_complex">Housing Complex</Label>
                  <Select
                    value={updatedProperty.housing_complex_id || ""}
                    onValueChange={(value) => {
                      if (value === "new") {
                        setAddComplexOpen(true);
                        setUpdatedProperty({
                          ...updatedProperty,
                          housing_complex_id: "",
                        });
                      } else {
                        setUpdatedProperty({
                          ...updatedProperty,
                          housing_complex_id: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-gray-300">
                      <SelectValue placeholder="Select complex" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                      {housingComplexes.map((complex) => (
                        <SelectItem key={complex.id} value={complex.id}>
                          {complex.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Add New Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Section */}
              <AddressInput
                address={updatedProperty.address}
                unit={updatedProperty.unit}
                city={updatedProperty.city}
                state={updatedProperty.state}
                zipCode={updatedProperty.zip_code}
                onAddressChange={(val) =>
                  setUpdatedProperty({ ...updatedProperty, address: val })
                }
                onUnitChange={(val) =>
                  setUpdatedProperty({ ...updatedProperty, unit: val })
                }
                onCityChange={(val) =>
                  setUpdatedProperty({ ...updatedProperty, city: val })
                }
                onStateChange={(val) =>
                  setUpdatedProperty({ ...updatedProperty, state: val })
                }
                onZipCodeChange={(val) =>
                  setUpdatedProperty({ ...updatedProperty, zip_code: val })
                }
              />

              {/* Property Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={updatedProperty.price}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, price: e.target.value })
                    }
                    required
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type</Label>
                  <select
                    className="border rounded-lg p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                    id="property_type"
                    value={updatedProperty.property_type}
                    onChange={(e) =>
                      setUpdatedProperty({
                        ...updatedProperty,
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
                    value={updatedProperty.bedrooms}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, bedrooms: e.target.value })
                    }
                    required
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    step="0.5"
                    value={updatedProperty.bathrooms}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, bathrooms: e.target.value })
                    }
                    required
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    type="number"
                    min="1"
                    value={updatedProperty.square_feet}
                    onChange={(e) =>
                      setUpdatedProperty({ ...updatedProperty, square_feet: e.target.value })
                    }
                    required
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Verification Document Section */}
              <div className="space-y-2">
                <Label htmlFor="verification_document">
                  Verification Document (Optional)
                </Label>
                <input
                  type="file"
                  id="verification_document"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVerificationDocument(e.target.files[0]);
                    }
                  }}
                  className="border rounded-lg p-2 w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                {verificationDocument && (
                  <div className="mt-2 flex items-center space-x-2">
                    {verificationDocument.type === "application/pdf" ? (
                      <ImageIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <img
                        src={URL.createObjectURL(verificationDocument)}
                        alt="Verification Preview"
                        className="h-6 w-6 object-cover rounded-lg"
                      />
                    )}
                    <span className="text-sm">{verificationDocument.name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload an image or PDF for property verification.
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Property"
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* AddHousingComplex modal */}
      <AddHousingComplex
        isOpen={addComplexOpen}
        onClose={() => setAddComplexOpen(false)}
        onAdd={handleAddComplex}
      />
    </>
  );
};
