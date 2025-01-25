// EditPropertyDialog.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { X, Upload } from "lucide-react";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import AddHousingComplex from "@/components/AddHousingComplex";
import axios from "axios"; // Import Axios
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete'; // Import PlacesAutocomplete

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = { id: string; name: string };

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
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load housing complexes",
          variant: "destructive",
        });
      }
    };

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
  }, [property, toast]);

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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
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

  // Function to fetch location details based on address
  const fetchLocationDetails = async (address: string) => {
    const apiKey = "AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I";
    if (!apiKey) {
      console.error("Google Maps API key is not set.");
      toast({
        title: "Error",
        description: "Internal configuration error. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: apiKey,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(response.data.error_message || "Failed to fetch location details.");
      }

      const result = response.data.results[0];
      const addressComponents = result.address_components;

      const getComponent = (types: string[]) => {
        const component = addressComponents.find((comp: any) =>
          types.every(type => comp.types.includes(type))
        );
        return component ? component.long_name : "";
      };

      const city = getComponent(["locality"]) || getComponent(["administrative_area_level_2"]);
      const state = getComponent(["administrative_area_level_1"]);
      const zip_code = getComponent(["postal_code"]);

      setUpdatedProperty((prev) => ({
        ...prev,
        city,
        state,
        zip_code,
      }));

      toast({
        title: "Address Parsed",
        description: "City, State, and ZIP code have been auto-filled.",
      });
    } catch (error: any) {
      console.error("Error fetching location details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse address.",
        variant: "destructive",
      });
    }
  };

  // Debounce function to limit API calls
  const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced version of fetchLocationDetails
  const debouncedFetchLocationDetails = debounce(fetchLocationDetails, 1000);

  return (
    <>
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
                required
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
            {/* Address with Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <PlacesAutocomplete
                value={updatedProperty.address}
                onChange={(address) => setUpdatedProperty({ ...updatedProperty, address })}
                onSelect={async (address) => {
                  try {
                    const results = await geocodeByAddress(address);
                    const latLng = await getLatLng(results[0]);
                    // Optionally, you can use latLng if needed
                    const components = results[0].address_components;

                    const getComponent = (types: string[]) => {
                      const component = components.find((comp: any) =>
                        types.every(type => comp.types.includes(type))
                      );
                      return component ? component.long_name : "";
                    };

                    const city = getComponent(["locality"]) || getComponent(["administrative_area_level_2"]);
                    const state = getComponent(["administrative_area_level_1"]);
                    const zip_code = getComponent(["postal_code"]);

                    setUpdatedProperty(prev => ({
                      ...prev,
                      address: address,
                      city,
                      state,
                      zip_code,
                    }));

                    toast({
                      title: "Address Selected",
                      description: "City, State, and ZIP code have been auto-filled.",
                    });
                  } catch (error: any) {
                    console.error("Error selecting address:", error);
                    toast({
                      title: "Error",
                      description: "Failed to parse selected address.",
                      variant: "destructive",
                    });
                  }
                }}
                debounce={500}
              >
                {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                  <div>
                    <Input
                      {...getInputProps({
                        placeholder: "Enter address...",
                        className: "w-full",
                        required: true,
                      })}
                    />
                    <div className="absolute bg-white border border-gray-300 w-full z-10">
                      {loading && <div className="p-2">Loading...</div>}
                      {suggestions.map((suggestion, index) => {
                        const style = {
                          backgroundColor: suggestion.active ? "#f0f0f0" : "#fff",
                          padding: "8px",
                          cursor: "pointer",
                        };
                        return (
                          <div
                            key={index}
                            {...getSuggestionItemProps(suggestion, { style })}
                          >
                            {suggestion.description}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </PlacesAutocomplete>
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
            {/* ZIP Code */}
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={updatedProperty.zip_code}
                onChange={(e) => setUpdatedProperty({ ...updatedProperty, zip_code: e.target.value })}
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="12345"
                required
              />
            </div>
            {/* Housing Complex Dropdown */}
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
                <SelectContent>
                  {housingComplexes.map((complex) => (
                    <SelectItem key={complex.id} value={complex.id}>
                      {complex.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Add New Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* AddHousingComplex Component */}
            <AddHousingComplex 
              isOpen={addComplexOpen}
              onClose={() => setAddComplexOpen(false)}
              onAdd={handleAddComplex}
            />
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Property"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
