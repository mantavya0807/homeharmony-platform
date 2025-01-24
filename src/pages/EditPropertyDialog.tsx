import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { X, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

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

export const EditPropertyDialog = ({ isOpen, onClose, property, onUpdate }: EditPropertyDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
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
  });
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);

  useEffect(() => {
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
      });
      setExistingMedia([]);
      setMediaFiles([]);
    }
  }, [property]);

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
    } catch (error) {
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

      const { data: publicUrlData} =
        supabase.storage.from("property-media").getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    });

    return await Promise.all(uploadPromises);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>Update the details of your property.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditProperty();
          }}
          className="space-y-6 mt-4"
        >
          {/* Property Fields */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={updatedProperty.title}
              onChange={(e) => setUpdatedProperty({ ...updatedProperty, title: e.target.value })}
              required
            />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={updatedProperty.description}
              onChange={(e) => setUpdatedProperty({ ...updatedProperty, description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
          {/* Price */}
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
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={updatedProperty.address}
              onChange={(e) => setUpdatedProperty({ ...updatedProperty, address: e.target.value })}
              required
            />
          </div>
          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={updatedProperty.city}
                onChange={(e) => setUpdatedProperty({ ...updatedProperty, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={updatedProperty.state}
                onChange={(e) => setUpdatedProperty({ ...updatedProperty, state: e.target.value })}
                required
              />
            </div>
          </div>
          {/* Bedrooms, Bathrooms, and Square Feet */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
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
                value={updatedProperty.square_feet}
                onChange={(e) => setUpdatedProperty({ ...updatedProperty, square_feet: e.target.value })}
                required
              />
            </div>
          </div> {/* <-- Added closing tag here */}

          {/* Existing Media */}
          <div className="space-y-2">
            <Label>Existing Media</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingMedia.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt={`Media ${index}`} className="w-full h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(url)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* New Media Upload */}
          <div className="space-y-2">
            <Label>Upload New Media</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative">
                  <img src={media.preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded cursor-pointer">
                <Upload size={20} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleMediaChange}
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Property"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
