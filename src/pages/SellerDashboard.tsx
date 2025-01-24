// SellerDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X, Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
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
import { Checkbox } from "@/components/ui/checkbox"; // Ensure you have a Checkbox component
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { EditPropertyDialog } from "./EditPropertyDialog";
import AddHousingComplex from "@/components/AddHousingComplex"; // Import the new component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,  // Add this import with other UI component imports
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Rest of your imports stay the same

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = Database["public"]["Tables"]["housing_complexes"]["Row"];

// Update PropertyForm interface
interface PropertyForm {
  title: string;
  description: string; // Added
  price: string;
  property_type: 'house' | 'apartment' | 'condo' | 'townhouse';
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  housing_complex_id?: string;
  google_maps_link?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false); // For property creation dialog
  const [addComplexOpen, setAddComplexOpen] = useState(false); // For AddHousingComplex dialog
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  // Initialize state with all fields
  const [newProperty, setNewProperty] = useState<PropertyForm>({
    title: "",
    description: "", // Added
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
    google_maps_link: "",
  });

  const [housingComplexes, setHousingComplexes] = useState<HousingComplex[]>([]);
  const [loadingHousingComplexes, setLoadingHousingComplexes] = useState(true);

  // Fetch properties and housing complexes on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          navigate("/auth");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profile?.role !== "seller") {
          navigate("/dashboard");
          return;
        }

        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("seller_id", session.user.id)
          .order("created_at", { ascending: false });

        if (propertiesError) {
          throw propertiesError;
        }

        if (properties) {
          setProperties(properties);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load properties. Please try again later.",
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

        if (data) {
          setHousingComplexes(data);
        }
      } catch (error) {
        console.error("Error fetching housing complexes:", error);
        toast({
          title: "Error",
          description: "Failed to load housing complexes.",
          variant: "destructive",
        });
      } finally {
        setLoadingHousingComplexes(false);
      }
    };

    fetchProperties();
    fetchHousingComplexes();
  }, [navigate, toast]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Each file must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setMediaFiles(prev => [...prev, {
          file,
          preview: reader.result as string,
          type
        }]);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (propertyId: string) => {
    const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
      try {
        const fileExt = mediaFile.file.name.split('.').pop();
        // Create a more unique filename using timestamp
        const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;
        
        // First check if file exists and remove it
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('property-media')
          .list(`${propertyId}`);

        if (listError) {
          throw listError;
        }

        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles.map(file => `${propertyId}/${file.name}`);
          const { error: removeError } = await supabase.storage
            .from('property-media')
            .remove(filesToRemove);
            
          if (removeError) {
            console.error('Error removing existing files:', removeError);
            // Decide whether to throw or continue
            // throw removeError;
          }
        }

        // Upload the new file
        const { error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(fileName, mediaFile.file, {
            cacheControl: '3600',
            upsert: true,
            contentType: mediaFile.file.type // Explicitly set content type
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('property-media')
          .getPublicUrl(fileName);
        
        return publicUrlData.publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error in upload promises:', error);
      throw error;
    }
  };

  // Update handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setUploading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        navigate("/auth");
        return;
      }

      // Create property
      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            title: newProperty.title,
            description: newProperty.description, // Added
            price: parseFloat(newProperty.price),
            address: newProperty.address,
            city: newProperty.city,
            state: newProperty.state,
            zip_code: newProperty.zip_code,
            bedrooms: parseInt(newProperty.bedrooms),
            bathrooms: parseInt(newProperty.bathrooms),
            square_feet: parseInt(newProperty.square_feet),
            property_type: newProperty.property_type,
            housing_complex_id: newProperty.housing_complex_id,
            seller_id: session.user.id,
            images: [], // Initialize with empty array
            google_maps_link: newProperty.google_maps_link || null, // Add the new field
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create property");

      // Upload media
      const mediaUrls = await uploadMedia(data.id);

      // Update property with media URLs
      const { error: updateError } = await supabase
        .from("properties")
        .update({ images: mediaUrls })
        .eq("id", data.id);

      if (updateError) throw updateError;

      // Update local state
      setProperties(prev => [{ ...data, images: mediaUrls }, ...prev]);
      resetForm();
      toast({
        title: "Success",
        description: "Property listed successfully",
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create property listing",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setOpen(false);
    }
  };

  // Update form validation
  const validateForm = (): boolean => {
    if (mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image or video",
        variant: "destructive",
      });
      return false;
    }

    const requiredFields = [
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "price", label: "Price" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip_code", label: "Zip Code" },
      { key: "bedrooms", label: "Bedrooms" },
      { key: "bathrooms", label: "Bathrooms" },
      { key: "square_feet", label: "Square Feet" },
      { key: "property_type", label: "Property Type" },
      { key: "housing_complex_id", label: "Housing Complex" },
    ];

    for (const field of requiredFields) {
      const value = (newProperty as any)[field.key];
      if (!value || (field.key === "housing_complex_id" && value === "")) {
        toast({
          title: "Error",
          description: `${field.label} is required`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Optional: Validate Google Maps URL if provided


    // Validate ZIP code format
    const zipCodePattern = /^\d{5}$/;
    if (!zipCodePattern.test(newProperty.zip_code)) {
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
      description: "", // Reset the field
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
      google_maps_link: "", // Reset the field
    });
    setMediaFiles([]);
  };

  const handleAddComplex = (newComplex: HousingComplex) => {
    setHousingComplexes(prev => [...prev, newComplex]);
    setNewProperty(prev => ({ ...prev, housing_complex_id: newComplex.id }));
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
          <DialogContent className="max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Enter the details of your property listing.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6 pr-4">
                {/* Media Upload Section */}
                <div className="space-y-4">
                  <Label>Property Media</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type === 'image' ? (
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
                      value={newProperty.title}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Add description field to the form */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProperty.description}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, description: e.target.value })
                      }
                      placeholder="Describe your property..."
                      required
                    />
                  </div>

                  {/* Housing Complex Section */}
                  <div className="space-y-2">
                    <Label htmlFor="housing_complex">Housing Complex</Label>
                    <Select
                      value={newProperty.housing_complex_id || ""}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setAddComplexOpen(true);
                          setNewProperty({ ...newProperty, housing_complex_id: "" });
                        } else {
                          setNewProperty({ ...newProperty, housing_complex_id: value });
                        }
                      }}
                      required
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
                </div>

                {/* Google Maps Link */}
                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">Google Maps Link</Label>
                  <Input
                    id="google_maps_link"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={newProperty.google_maps_link}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, google_maps_link: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a Google Maps URL for the property's location (optional).
                  </p>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProperty.price}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select
                      value={newProperty.property_type}
                      onValueChange={(value: Database["public"]["Enums"]["property_type"]) =>
                        setNewProperty({ ...newProperty, property_type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                      </SelectContent>
                    </Select>
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
                        setNewProperty({ ...newProperty, bedrooms: e.target.value })
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
                        setNewProperty({ ...newProperty, bathrooms: e.target.value })
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
                        setNewProperty({ ...newProperty, square_feet: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newProperty.address}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, address: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newProperty.city}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={newProperty.state}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={newProperty.zip_code}
                      onChange={(e) =>
                        setNewProperty({ ...newProperty, zip_code: e.target.value })
                      }
                      pattern="[0-9]{5}"
                      maxLength={5}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={uploading}
                >
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

      {/* AddHousingComplex Component */}
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
              Start by adding your first property listing. Click the "Add New Property" button above to get started.
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
                imageUrl={property.images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-lg">
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    console.log("Editing property:", property);
                    setEditingProperty(property); // Set the property to be edited
                    setEditDialogOpen(true); // Open the dialog
                  }}
                >
                  Edit
                </Button>
                <EditPropertyDialog
                  isOpen={isEditDialogOpen}
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
                    const { error } = await supabase
                      .from("properties")
                      .delete()
                      .eq("id", property.id);

                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to delete property",
                        variant: "destructive",
                      });
                      return;
                    }

                    setProperties(prev => prev.filter(p => p.id !== property.id));
                    toast({
                      title: "Success",
                      description: "Property deleted successfully",
                    });
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
