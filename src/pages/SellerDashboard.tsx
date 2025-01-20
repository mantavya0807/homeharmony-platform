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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

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
  const [open, setOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const [newProperty, setNewProperty] = useState({
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
    property_type: "house" as const,
  });

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
          .eq("seller_id", session.user.id);

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

    fetchProperties();
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
        const { data: publicUrlData, error: urlError } = supabase.storage
          .from('property-media')
          .getPublicUrl(fileName);
        
        if (urlError) {
          throw urlError;
        }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create a listing",
          variant: "destructive",
        });
        return;
      }

      // Validate media files
      if (mediaFiles.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one image",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // First create the property
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
            images: [], // Initialize with empty array
          },
        ])
        .select();

      if (error) throw error;
      if (!data?.[0]) throw new Error("Failed to create property");

      // Then upload media files
      const mediaUrls = await uploadMedia(data[0].id);

      // Update property with media URLs
      const { error: updateError } = await supabase
        .from("properties")
        .update({ images: mediaUrls })
        .eq("id", data[0].id);

      if (updateError) throw updateError;

      // Update local state
      setProperties(prev => [...prev, { ...data[0], images: mediaUrls }]);
      setOpen(false);
      setMediaFiles([]);
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
      });

      toast({
        title: "Success",
        description: "Property listing created successfully",
      });
    } catch (error) {
      console.error('Error creating property listing:', error);
      toast({
        title: "Error",
        description: "Failed to create property listing",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
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
          <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Enter the details of your property listing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProperty.description}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, description: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                </div>
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
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
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
                    value={newProperty.square_feet}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, square_feet: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

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
          </DialogContent>
        </Dialog>
      </div>
      
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
                    // Edit functionality can be added here
                    toast({
                      title: "Coming Soon",
                      description: "Edit functionality will be available soon!",
                    });
                  }}
                >
                  Edit
                </Button>
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
