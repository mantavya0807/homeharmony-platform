// EditPropertyDialog.tsx

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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import AddHousingComplex from "@/components/AddHousingComplex";
import {AddressInput} from "@/components/AddressInput"; // Import your existing AddressInput component

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = Database["public"]["Tables"]["housing_complexes"]["Row"];

interface EditPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onUpdate: (updatedProperty: Property) => void;
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
  const [loading, setLoading] = useState(false);
  const [housingComplexes, setHousingComplexes] = useState<HousingComplex[]>([]);
  const [addComplexOpen, setAddComplexOpen] = useState(false);

  // Initialize with default values; update in useEffect
  const [updatedProperty, setUpdatedProperty] = useState({
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
    housing_complex_id: "",
    property_type: "house",
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);

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
        // Reset if no property is provided
        setUpdatedProperty({
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
          housing_complex_id: "",
          property_type: "house",
        });
        setExistingMedia([]);
        setMediaFiles([]);
      }
    }
  }, [isOpen, property, toast]);

  const handleEditProperty = async () => {
    if (!property) return;

    try {
      setLoading(true);

      // Update text details of the property
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          ...updatedProperty,
          price: parseFloat(updatedProperty.price),
          bedrooms: parseInt(updatedProperty.bedrooms),
          bathrooms: parseInt(updatedProperty.bathrooms),
          square_feet: parseInt(updatedProperty.square_feet),
        })
        .eq("id", property.id);

      if (updateError) throw updateError;

      // Upload new media files
      const uploadedUrls = await uploadMedia(property.id);

      // Final list of images (existing + new uploads)
      const updatedImages = [...existingMedia, ...uploadedUrls];

      // Update the property with the new images
      const { error: mediaUpdateError } = await supabase
        .from("properties")
        .update({ images: updatedImages })
        .eq("id", property.id);

      if (mediaUpdateError) throw mediaUpdateError;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      // Update parent state
      onUpdate({
        ...property,
        ...updatedProperty,
        price: parseFloat(updatedProperty.price),
        bedrooms: parseInt(updatedProperty.bedrooms),
        bathrooms: parseInt(updatedProperty.bathrooms),
        square_feet: parseInt(updatedProperty.square_feet),
        images: updatedImages,
      });
      onClose(); // Close the dialog
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      const { data: publicUrlData } =
        supabase.storage.from("property-media").getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    });

    return await Promise.all(uploadPromises);
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Function to handle adding a new housing complex from AddHousingComplex component
  const handleAddComplex = (newComplex: HousingComplex) => {
    setHousingComplexes((prev) => [...prev, newComplex]);
    setUpdatedProperty((prev) => ({ ...prev, housing_complex_id: newComplex.id }));
    setAddComplexOpen(false); // Close the AddHousingComplex dialog
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update the details of your property.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditProperty();
            }}
            className="space-y-6 p-6"
          >
            {/* Media Upload Section */}
            <div className="space-y-4">
              <Label>Property Media</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={updatedProperty.title}
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={updatedProperty.description}
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, description: e.target.value })}
                  className="min-h-[100px]"
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
                      setUpdatedProperty({ ...updatedProperty, housing_complex_id: "" });
                    } else {
                      setUpdatedProperty({ ...updatedProperty, housing_complex_id: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select complex" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
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

            {/* Address Information Section */}
            <AddressInput
              address={updatedProperty.address}
              city={updatedProperty.city}
              state={updatedProperty.state}
              zipCode={updatedProperty.zip_code}
              onAddressChange={(address) => setUpdatedProperty({ ...updatedProperty, address })}
              onCityChange={(city) => setUpdatedProperty({ ...updatedProperty, city })}
              onStateChange={(state) => setUpdatedProperty({ ...updatedProperty, state })}
              onZipCodeChange={(zip) => setUpdatedProperty({ ...updatedProperty, zip_code: zip })}
            />

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={updatedProperty.price}
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type</Label>
                <select
                  className="border rounded p-2 w-full"
                  id="property_type"
                  value={updatedProperty.property_type}
                  onChange={(e) =>
                    setUpdatedProperty({
                      ...updatedProperty,
                      property_type: e.target.value as "house" | "apartment" | "condo" | "townhouse",
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
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, bedrooms: e.target.value })}
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
                  value={updatedProperty.bathrooms}
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, bathrooms: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input
                  id="square_feet"
                  type="number"
                  min="1"
                  value={updatedProperty.square_feet}
                  onChange={(e) => setUpdatedProperty({ ...updatedProperty, square_feet: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Amenities Section */}
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Common Amenities */}
                {Object.entries(updatedProperty).map(([key, value]) => {
                  if (key.startsWith("has_")) {
                    return (
                      <div key={key} className="flex items-center">
                        <Checkbox
                          id={key}
                          checked={Boolean(value)}
                          onCheckedChange={(checked) =>
                            setUpdatedProperty({ ...updatedProperty, [key]: checked })
                          }
                        />
                        <Label htmlFor={key} className="ml-2">
                          {key
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")
                            .replace(/^Has\s/, "")}
                        </Label>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
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
        </DialogContent>
      </Dialog>
      {/* AddHousingComplex Component */}
      <AddHousingComplex
        isOpen={addComplexOpen}
        onClose={() => setAddComplexOpen(false)}
        onAdd={handleAddComplex}
      />
    </>
  );
};
