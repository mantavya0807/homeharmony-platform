// AddHousingComplex.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AddHousingComplexProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (complex: any) => void; // Replace 'any' with your HousingComplex type if available
}

export default function AddHousingComplex({ isOpen, onClose, onAdd }: AddHousingComplexProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
  const [loading, setLoading] = useState(false);

  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAmenities((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

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
    setLoading(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const photoName = `housing-complexes/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("housing-complex-photos") // Ensure this bucket exists
          .upload(photoName, photoFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: photoFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("housing-complex-photos")
          .getPublicUrl(photoName);

        if (urlError) {
          throw urlError;
        }

        photoUrl = publicUrlData.publicUrl;
      }

      const { data: newComplex, error: insertError } = await supabase
        .from("housing_complexes")
        .insert([
          {
            name: name.trim(),
            photo_url: photoUrl,
            ...amenities,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Housing complex added successfully.",
      });

      onAdd(newComplex);
      // Reset form
      setName("");
      setPhotoFile(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Housing Complex</DialogTitle>
          <DialogDescription>
            Provide the details of the housing complex you want to add.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="complex_photo">Photo (Optional)</Label>
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors">
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

          {/* Amenities */}
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Common Amenities */}
              <div className="flex items-center">
                <Checkbox
                  id="has_swimming_pool"
                  name="has_swimming_pool"
                  checked={amenities.has_swimming_pool}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_swimming_pool: checked }))
                  }
                />
                <Label htmlFor="has_swimming_pool" className="ml-2">
                  Swimming Pool
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_gym"
                  name="has_gym"
                  checked={amenities.has_gym}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_gym: checked }))
                  }
                />
                <Label htmlFor="has_gym" className="ml-2">
                  Gym
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_clubhouse"
                  name="has_clubhouse"
                  checked={amenities.has_clubhouse}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_clubhouse: checked }))
                  }
                />
                <Label htmlFor="has_clubhouse" className="ml-2">
                  Clubhouse
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_business_center"
                  name="has_business_center"
                  checked={amenities.has_business_center}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_business_center: checked }))
                  }
                />
                <Label htmlFor="has_business_center" className="ml-2">
                  Business Center
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_community_room"
                  name="has_community_room"
                  checked={amenities.has_community_room}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_community_room: checked }))
                  }
                />
                <Label htmlFor="has_community_room" className="ml-2">
                  Community Room
                </Label>
              </div>

              {/* Security Features */}
              <div className="flex items-center">
                <Checkbox
                  id="has_gated_entry"
                  name="has_gated_entry"
                  checked={amenities.has_gated_entry}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_gated_entry: checked }))
                  }
                />
                <Label htmlFor="has_gated_entry" className="ml-2">
                  Gated Entry
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_security_cameras"
                  name="has_security_cameras"
                  checked={amenities.has_security_cameras}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_security_cameras: checked }))
                  }
                />
                <Label htmlFor="has_security_cameras" className="ml-2">
                  Security Cameras
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_doorman"
                  name="has_doorman"
                  checked={amenities.has_doorman}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_doorman: checked }))
                  }
                />
                <Label htmlFor="has_doorman" className="ml-2">
                  Doorman
                </Label>
              </div>

              {/* Outdoor Features */}
              <div className="flex items-center">
                <Checkbox
                  id="has_playground"
                  name="has_playground"
                  checked={amenities.has_playground}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_playground: checked }))
                  }
                />
                <Label htmlFor="has_playground" className="ml-2">
                  Playground
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_bbq_area"
                  name="has_bbq_area"
                  checked={amenities.has_bbq_area}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_bbq_area: checked }))
                  }
                />
                <Label htmlFor="has_bbq_area" className="ml-2">
                  BBQ Area
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_dog_park"
                  name="has_dog_park"
                  checked={amenities.has_dog_park}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_dog_park: checked }))
                  }
                />
                <Label htmlFor="has_dog_park" className="ml-2">
                  Dog Park
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_tennis_court"
                  name="has_tennis_court"
                  checked={amenities.has_tennis_court}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_tennis_court: checked }))
                  }
                />
                <Label htmlFor="has_tennis_court" className="ml-2">
                  Tennis Court
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_basketball_court"
                  name="has_basketball_court"
                  checked={amenities.has_basketball_court}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_basketball_court: checked }))
                  }
                />
                <Label htmlFor="has_basketball_court" className="ml-2">
                  Basketball Court
                </Label>
              </div>

              {/* Indoor Features */}
              <div className="flex items-center">
                <Checkbox
                  id="has_elevator"
                  name="has_elevator"
                  checked={amenities.has_elevator}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_elevator: checked }))
                  }
                />
                <Label htmlFor="has_elevator" className="ml-2">
                  Elevator
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_parking_garage"
                  name="has_parking_garage"
                  checked={amenities.has_parking_garage}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_parking_garage: checked }))
                  }
                />
                <Label htmlFor="has_parking_garage" className="ml-2">
                  Parking Garage
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_package_room"
                  name="has_package_room"
                  checked={amenities.has_package_room}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_package_room: checked }))
                  }
                />
                <Label htmlFor="has_package_room" className="ml-2">
                  Package Room
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_laundry_facility"
                  name="has_laundry_facility"
                  checked={amenities.has_laundry_facility}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_laundry_facility: checked }))
                  }
                />
                <Label htmlFor="has_laundry_facility" className="ml-2">
                  Laundry Facility
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_bike_storage"
                  name="has_bike_storage"
                  checked={amenities.has_bike_storage}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_bike_storage: checked }))
                  }
                />
                <Label htmlFor="has_bike_storage" className="ml-2">
                  Bike Storage
                </Label>
              </div>

              {/* Wellness Features */}
              <div className="flex items-center">
                <Checkbox
                  id="has_sauna"
                  name="has_sauna"
                  checked={amenities.has_sauna}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_sauna: checked }))
                  }
                />
                <Label htmlFor="has_sauna" className="ml-2">
                  Sauna
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_spa"
                  name="has_spa"
                  checked={amenities.has_spa}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_spa: checked }))
                  }
                />
                <Label htmlFor="has_spa" className="ml-2">
                  Spa
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_yoga_studio"
                  name="has_yoga_studio"
                  checked={amenities.has_yoga_studio}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_yoga_studio: checked }))
                  }
                />
                <Label htmlFor="has_yoga_studio" className="ml-2">
                  Yoga Studio
                </Label>
              </div>

              {/* Entertainment */}
              <div className="flex items-center">
                <Checkbox
                  id="has_movie_theater"
                  name="has_movie_theater"
                  checked={amenities.has_movie_theater}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_movie_theater: checked }))
                  }
                />
                <Label htmlFor="has_movie_theater" className="ml-2">
                  Movie Theater
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="has_game_room"
                  name="has_game_room"
                  checked={amenities.has_game_room}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) => ({ ...prev, has_game_room: checked }))
                  }
                />
                <Label htmlFor="has_game_room" className="ml-2">
                  Game Room
                </Label>
              </div>
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
