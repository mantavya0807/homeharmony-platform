 // src/components/AddHousingComplex.tsx

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AddressInput } from "@/components/AddressInput";

interface AddHousingComplexProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (complex: HousingComplex) => void;
}

interface HousingComplex {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  has_swimming_pool: boolean;
  has_gym: boolean;
  has_clubhouse: boolean;
  has_business_center: boolean;
  has_community_room: boolean;
  has_gated_entry: boolean;
  has_security_cameras: boolean;
  has_doorman: boolean;
  has_playground: boolean;
  has_bbq_area: boolean;
  has_dog_park: boolean;
  has_tennis_court: boolean;
  has_basketball_court: boolean;
  has_elevator: boolean;
  has_parking_garage: boolean;
  has_package_room: boolean;
  has_laundry_facility: boolean;
  has_bike_storage: boolean;
  has_sauna: boolean;
  has_spa: boolean;
  has_yoga_studio: boolean;
  has_movie_theater: boolean;
  has_game_room: boolean;
  created_at: string;
  updated_at: string;
}

interface HousingComplexPhoto {
  id: string;
  complex_id: string;
  photo_url: string;
  created_at: string;
}

export default function AddHousingComplex({
  isOpen,
  onClose,
  onAdd,
}: AddHousingComplexProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip_code, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<{
    has_swimming_pool: boolean;
    has_gym: boolean;
    has_clubhouse: boolean;
    has_business_center: boolean;
    has_community_room: boolean;
    has_gated_entry: boolean;
    has_security_cameras: boolean;
    has_doorman: boolean;
    has_playground: boolean;
    has_bbq_area: boolean;
    has_dog_park: boolean;
    has_tennis_court: boolean;
    has_basketball_court: boolean;
    has_elevator: boolean;
    has_parking_garage: boolean;
    has_package_room: boolean;
    has_laundry_facility: boolean;
    has_bike_storage: boolean;
    has_sauna: boolean;
    has_spa: boolean;
    has_yoga_studio: boolean;
    has_movie_theater: boolean;
    has_game_room: boolean;
  }>({
    has_swimming_pool: false,
    has_gym: false,
    has_clubhouse: false,
    has_business_center: false,
    has_community_room: false,
    has_gated_entry: false,
    has_security_cameras: false,
    has_doorman: false,
    has_playground: false,
    has_bbq_area: false,
    has_dog_park: false,
    has_tennis_court: false,
    has_basketball_court: false,
    has_elevator: false,
    has_parking_garage: false,
    has_package_room: false,
    has_laundry_facility: false,
    has_bike_storage: false,
    has_sauna: false,
    has_spa: false,
    has_yoga_studio: false,
    has_movie_theater: false,
    has_game_room: false,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Enforce individual file size limit
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} must be less than 10MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    setPhotoFiles((prev) => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Housing complex name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim() || !city.trim() || !stateField.trim() || !zip_code.trim()) {
      toast({
        title: "Error",
        description: "Address, City, State, and ZIP code are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert into housing_complexes
      const { data: complexData, error: insertError } = await supabase
        .from("housing_complexes")
        .insert([
          {
            name: name.trim(),
            address: address.trim(),
            city: city.trim(),
            state: stateField.trim(),
            zip_code: zip_code.trim(),
            has_swimming_pool: amenities.has_swimming_pool,
            has_gym: amenities.has_gym,
            has_clubhouse: amenities.has_clubhouse,
            has_business_center: amenities.has_business_center,
            has_community_room: amenities.has_community_room,
            has_gated_entry: amenities.has_gated_entry,
            has_security_cameras: amenities.has_security_cameras,
            has_doorman: amenities.has_doorman,
            has_playground: amenities.has_playground,
            has_bbq_area: amenities.has_bbq_area,
            has_dog_park: amenities.has_dog_park,
            has_tennis_court: amenities.has_tennis_court,
            has_basketball_court: amenities.has_basketball_court,
            has_elevator: amenities.has_elevator,
            has_parking_garage: amenities.has_parking_garage,
            has_package_room: amenities.has_package_room,
            has_laundry_facility: amenities.has_laundry_facility,
            has_bike_storage: amenities.has_bike_storage,
            has_sauna: amenities.has_sauna,
            has_spa: amenities.has_spa,
            has_yoga_studio: amenities.has_yoga_studio,
            has_movie_theater: amenities.has_movie_theater,
            has_game_room: amenities.has_game_room,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!complexData) throw new Error("Failed to create housing complex");

      let photoUploadErrors: any[] = [];
      let photoUrls: string[] = [];

      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(async (file) => {
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/\s+/g, '-');
          const photoName = `housing-complexes/${complexData.id}/${timestamp}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage
            .from("housing-complex-photos")
            .upload(photoName, file, {
              cacheControl: "3600",
              upsert: true,
              contentType: file.type,
            });

          if (uploadError) {
            photoUploadErrors.push(uploadError);
            return null;
          }

          const { data: publicUrlData, error: urlError } = supabase.storage
            .from("housing-complex-photos")
            .getPublicUrl(photoName);

          if (urlError) {
            photoUploadErrors.push(urlError);
            return null;
          }

          return publicUrlData.publicUrl;
        });

        const results = await Promise.all(uploadPromises);
        photoUrls = results.filter((url): url is string => url !== null);

        // Insert photo URLs into housing_complex_photos table
        const photoInsertPromises = photoUrls.map(async (url) => {
          const { error: photoInsertError } = await supabase
            .from("housing_complex_photos")
            .insert([
              {
                complex_id: complexData.id,
                photo_url: url,
              },
            ]);

          if (photoInsertError) {
            photoUploadErrors.push(photoInsertError);
          }
        });

        await Promise.all(photoInsertPromises);
      }

      if (photoUploadErrors.length > 0) {
        throw new Error("Some photos failed to upload.");
      }

      toast({
        title: "Success",
        description: "Housing complex added successfully.",
      });

      onAdd(complexData);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error adding housing complex:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add housing complex.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhotoFiles([]);
    setAddress("");
    setCity("");
    setStateField("");
    setZipCode("");
    setAmenities({
      has_swimming_pool: false,
      has_gym: false,
      has_clubhouse: false,
      has_business_center: false,
      has_community_room: false,
      has_gated_entry: false,
      has_security_cameras: false,
      has_doorman: false,
      has_playground: false,
      has_bbq_area: false,
      has_dog_park: false,
      has_tennis_court: false,
      has_basketball_court: false,
      has_elevator: false,
      has_parking_garage: false,
      has_package_room: false,
      has_laundry_facility: false,
      has_bike_storage: false,
      has_sauna: false,
      has_spa: false,
      has_yoga_studio: false,
      has_movie_theater: false,
      has_game_room: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Housing Complex</DialogTitle>
          <DialogDescription>
            Provide the details of the housing complex you want to add, including multiple photos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="complex_name">Name</Label>
            <Input
              id="complex_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter housing complex name"
              required
            />
          </div>

          {/* Address Input */}
          <AddressInput
            address={address}
            city={city}
            state={stateField}
            zipCode={zip_code}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onStateChange={setStateField}
            onZipCodeChange={setZipCode}
          />

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="complex_photos">Photos (Optional)</Label>
            <div className="flex flex-wrap gap-4">
              {photoFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors relative">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Photos</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload multiple images (max 10MB each)
            </p>
          </div>

          {/* Amenities Section */}
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              {Object.entries(amenities).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked: boolean) =>
                      setAmenities((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                  <Label htmlFor={key} className="ml-2">
                    {key
                      .split('_')
                      .map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(' ')
                      .replace('Has ', '')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Housing Complex"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
