import { useState } from "react";
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
  onAdd: (complex: any) => void; // Replace 'any' with your HousingComplex type if available
}

export default function AddHousingComplex({ isOpen, onClose, onAdd }: AddHousingComplexProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateField] = useState("");
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
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Photo must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
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

    if (!address.trim() || !city.trim() || !state.trim() || !zip_code.trim()) {
      toast({
        title: "Error",
        description: "Address, City, State, and ZIP code are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const photoName = `housing-complexes/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("housing-complex-photos")
          .upload(photoName, photoFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: photoFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("housing-complex-photos")
          .getPublicUrl(photoName);

        if (urlError) throw urlError;

        photoUrl = publicUrlData.publicUrl;
      }

      const { data: newComplex, error: insertError } = await supabase
        .from("housing_complexes")
        .insert([
          {
            name: name.trim(),
            photo_url: photoUrl,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            zip_code: zip_code.trim(),
            ...amenities,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Housing complex added successfully.",
      });

      onAdd(newComplex);
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
    setPhotoFile(null);
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
      <DialogContent className="sm:max-w-[600px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Housing Complex</DialogTitle>
          <DialogDescription>
            Provide the details of the housing complex you want to add.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-4 pb-6">
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
            state={state}
            zipCode={zip_code}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onStateChange={setStateField}
            onZipCodeChange={setZipCode}
          />

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="complex_photo">Photo (Optional)</Label>
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors relative">
              <div className="flex flex-col items-center justify-center">
                {photoFile ? (
                  <span className="text-xs text-muted-foreground">{photoFile.name}</span>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload Photo</span>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {/* Amenities Section */}
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Common Amenities */}
              {Object.entries(amenities).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setAmenities((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                  <Label htmlFor={key} className="ml-2">
                    {key.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ').replace('Has ', '')}
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