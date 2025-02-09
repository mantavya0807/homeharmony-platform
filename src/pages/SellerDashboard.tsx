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
import { AddressInput } from "@/components/AddressInput";
import StripeOnboarding from "@/components/StripeOnboarding";

import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type HousingComplex = Database["public"]["Tables"]["housing_complexes"]["Row"];

type PropertyType = "house" | "apartment" | "condo" | "townhouse";

interface PropertyForm {
  title: string;
  description: string;
  price: string;
  property_type: PropertyType;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  address: string;
  unit: string;
  city: string;
  state: string;
  zip_code: string;
  housing_complex_id?: string;
  sublease_from?: string;
  sublease_to?: string;
  verification_document?: File | null;
  original_lease_rent?: string;
  original_lease_term?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
  room: string;
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stripeConnected, setStripeConnected] = useState(false);
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
    unit: "",
    city: "",
    state: "",
    zip_code: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    property_type: "house",
    housing_complex_id: "",
    sublease_from: "",
    sublease_to: "",
    verification_document: null,
    original_lease_rent: "",
    original_lease_term: "",
  });

  useEffect(() => {
    const checkStripeConnection = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", session.user.id)
          .single();
        setStripeConnected(!!profile?.stripe_account_id);
      }
    };
    checkStripeConnection();
  }, []);

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
      console.log("Fetched Properties:", data);
    } catch (error) {
      console.error("Error fetching properties:", error);
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
      console.log("Fetched Housing Complexes:", data);
    } catch (error) {
      console.error("Error fetching housing complexes:", error);
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      });
    } finally {
      setLoadingHousingComplexes(false);
    }
  };

  const handlePropertyTypeChange = (propertyType: PropertyType) => {
    setNewProperty((prev) => ({
      ...prev,
      property_type: propertyType,
      housing_complex_id:
        propertyType === "house" || propertyType === "townhouse"
          ? ""
          : prev.housing_complex_id,
    }));
    console.log("Property type changed to:", propertyType);
  };

  const handleAddComplex = (newComplex: HousingComplex) => {
    setHousingComplexes((prev) => [...prev, newComplex]);
    setNewProperty((prev) => ({
      ...prev,
      housing_complex_id: newComplex.id,
    }));
    console.log("Added new housing complex:", newComplex);
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
            room: "", // default: user must select the room type
          },
        ]);
        console.log(`Added media file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const updateMediaFileRoom = (index: number, room: string) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      updated[index].room = room;
      return updated;
    });
  };

  const removeMedia = (index: number) => {
    const removed = mediaFiles[index];
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    console.log(`Removed media file: ${removed.file.name}`);
  };

  const uploadMedia = async (propertyId: string) => {
    const uploadPromises = mediaFiles.map(async (mediaFile, index) => {
      try {
        const roomSegment = mediaFile.room
          ? `-${mediaFile.room.replace(/\s+/g, "_")}`
          : "";
        const fileExt = mediaFile.file.name.split(".").pop();
        const fileName = `${propertyId}/${Date.now()}-${index}.${fileExt}`;
        const { data: existingFiles } = await supabase.storage
          .from("property-media")
          .list(`${propertyId}`);
        if (existingFiles?.length) {
          const filesToRemove = existingFiles.map(
            (file) => `${propertyId}/${file.name}`
          );
          await supabase.storage.from("property-media").remove(filesToRemove);
          console.log("Removed existing media files:", filesToRemove);
        }
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
        console.log("Uploaded media file:", fileName);
        return data.publicUrl;
      } catch (error) {
        console.error("Error uploading media:", error);
        throw error;
      }
    });
    
    return await Promise.all(uploadPromises);
  };

  const handleVerificationUpload = async (
    propertyId: string,
    file: File,
    propertyDetails: {
      address: string;
      unit: string;
      city: string;
      state: string;
      zip_code: string;
      price: string;
      original_lease_rent?: string;
    }
  ) => {
    try {
      console.log(
        "[Frontend] Starting verification upload for property:",
        propertyId
      );
      console.log("[Frontend] File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      console.log("[Frontend] Property details:", propertyDetails);

      // Validate file size and type
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "File type not supported. Please upload a JPEG, PNG, or PDF file."
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "propertyDetails",
        JSON.stringify({
          ...propertyDetails,
          unit: propertyDetails.unit, // Include unit in verification
        })
      );

      console.log("[Frontend] Sending request to /api/verify-document ...");
      const response = await fetch("http://localhost:4000/api/verify-document", {
        method: "POST",
        body: formData,
      });

      console.log("[Frontend] Received response:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Frontend] Verification error response:", errorData);
        throw new Error(errorData.error || "Document verification failed");
      }

      const verificationResult = await response.json();
      console.log("[Frontend] Verification result:", verificationResult);

      // --- Compute additional lease info values ---
      const rawLeaseRent = verificationResult.leaseInfo?.originalRent;
      const originalLease =
        rawLeaseRent != null && !isNaN(parseFloat(rawLeaseRent))
          ? parseFloat(rawLeaseRent)
          : null;

      const currentPrice = propertyDetails.price
        ? parseFloat(propertyDetails.price)
        : null;

      let rentDifferential = null;
      if (originalLease !== null && currentPrice !== null && currentPrice !== 0) {
        const diff = ((originalLease - currentPrice) / currentPrice) * 100;
        rentDifferential = !isNaN(diff) ? parseFloat(diff.toFixed(2)) : null;
        if (rentDifferential !== null && Math.abs(rentDifferential) >= 1000) {
          console.warn(
            "[Frontend] Computed rent differential is out of range:",
            rentDifferential
          );
          rentDifferential = null;
        }
      }

      const leaseTermRaw = verificationResult.leaseInfo?.leaseTerm;
      let originalLeaseTerm = null;
      if (leaseTermRaw != null) {
        const term = parseInt(String(leaseTermRaw), 10);
        originalLeaseTerm = isNaN(term) ? null : term;
      }

      console.log("[Frontend] Computed values:", {
        originalLease,
        currentPrice,
        rentDifferential,
        originalLeaseTerm,
      });

      // --- Upload the verification document to Supabase ---
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${propertyId}/${timestamp}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-verifications")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("property-verifications")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      // --- Update the property record with verification data ---
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          is_verified: verificationResult.is_verified,
          verification_document_url: publicUrlData.publicUrl,
          verified_at: verificationResult.is_verified
            ? new Date().toISOString()
            : null,
          sublease_from: verificationResult.leaseInfo?.startDate
            ? new Date(verificationResult.leaseInfo.startDate).toISOString()
            : null,
          sublease_to: verificationResult.leaseInfo?.endDate
            ? new Date(verificationResult.leaseInfo.endDate).toISOString()
            : null,
          original_lease_rent: verificationResult.leaseInfo?.originalRent || null,
          rent_differential: (() => {
            const originalRent = verificationResult.leaseInfo?.originalRent;
            const currentPrice = parseFloat(propertyDetails.price);
            if (!originalRent || !currentPrice || currentPrice === 0) return null;
            const diff = ((originalRent - currentPrice) / currentPrice) * 100;
            return Math.max(Math.min(diff, 999.99), -999.99);
          })(),
          original_lease_term: verificationResult.leaseInfo?.leaseTerm || null,
        })
        .eq("id", propertyId);
      console.log(verificationResult);
      if (updateError) {
        console.error("Update error details:", updateError);
        throw new Error("Failed to update property verification status");
      }

      toast({
        title: verificationResult.is_verified
          ? "Verification Successful"
          : "Verification Pending",
        description: verificationResult.is_verified
          ? `Document verified (Score: ${verificationResult.score?.toFixed(2)})`
          : "Not enough matching details found for automatic verification.",
        variant: verificationResult.is_verified ? "default" : "destructive",
      });

      return {
        success: true,
        is_verified: verificationResult.is_verified,
        documentUrl: publicUrlData.publicUrl,
        matches: verificationResult.matches,
      };
    } catch (error: any) {
      console.error("[Frontend] Verification Error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify property.",
        variant: "destructive",
      });
      throw error;
    }
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
      const {
        title,
        description,
        price,
        property_type,
        bedrooms,
        bathrooms,
        square_feet,
        address,
        unit,
        city,
        state,
        zip_code,
        housing_complex_id,
        sublease_from,
        sublease_to,
        verification_document,
        original_lease_rent,
      } = newProperty;
      console.log("Creating new property in Supabase...");
      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            property_type,
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            square_feet: parseInt(square_feet),
            address,
            unit,
            city,
            state,
            zip_code,
            housing_complex_id:
              property_type === "house" || property_type === "townhouse"
                ? null
                : housing_complex_id || null,
            seller_id: session.user.id,
            images: [],
            sublease_from: sublease_from
              ? new Date(sublease_from).toISOString()
              : null,
            sublease_to: sublease_to ? new Date(sublease_to).toISOString() : null,
            is_verified: false,
            verification_document_url: null,
            verified_at: null,
            original_lease_rent: original_lease_rent
              ? parseFloat(original_lease_rent)
              : null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Failed to create property");
      console.log("New property created:", data);
      if (mediaFiles.length > 0) {
        console.log("Uploading media files...");
        const mediaUrls = await uploadMedia(data.id);
        console.log("Updating property with media URLs...");
        const { error: updateError } = await supabase
          .from("properties")
          .update({ images: mediaUrls })
          .eq("id", data.id);
        if (updateError) throw updateError;
        console.log("Property media updated.");
      } else {
        console.log("No media files to upload.");
      }
      if (verification_document) {
        console.log("Uploading verification document...");
        const propertyDetails = {
          address,
          unit,
          city,
          state,
          zip_code,
          price,
          original_lease_rent,
        };
        await handleVerificationUpload(data.id, verification_document, propertyDetails);
      }
      await fetchProperties();
      resetForm();
      setOpen(false);
      toast({
        title: "Success",
        description: "Property listed successfully",
      });
    } catch (error: any) {
      console.error("Error creating property:", error);
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
      "unit",
      "city",
      "state",
      "zip_code",
      "bedrooms",
      "bathrooms",
      "square_feet",
      "property_type",
      "sublease_from",
      "sublease_to",
    ];
    for (const field of required) {
      if (!(newProperty as any)[field]) {
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
    if (newProperty.sublease_from && newProperty.sublease_to) {
      const fromDate = new Date(newProperty.sublease_from);
      const toDate = new Date(newProperty.sublease_to);
      if (fromDate > toDate) {
        toast({
          title: "Error",
          description: "Sublease 'from' date cannot be later than 'to' date",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const resetForm = () => {
    setNewProperty({
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
      property_type: "house",
      housing_complex_id: "",
      sublease_from: "",
      sublease_to: "",
      verification_document: null,
      original_lease_rent: "",
      original_lease_term: "",
    });
    setMediaFiles([]);
    console.log("Form reset.");
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
      {!stripeConnected && (
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              Connect your Stripe account to start receiving payments
            </p>
          </div>
          <StripeOnboarding />
        </div>
      )}
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
                {/* Media Upload */}
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
                        {/* Room Selection Dropdown */}
                        <select
                          value={file.room}
                          onChange={(e) => updateMediaFileRoom(index, e.target.value)}
                          className="mt-1 block w-full text-sm border rounded"
                        >
                          <option value="">Select Room</option>
                          <option value="bedroom">Bedroom</option>
                          <option value="living room">Living Room</option>
                          <option value="bathroom">Bathroom</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="floorplan">Floorplan</option>
                          <option value="other">Other</option>
                        </select>
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
                        setNewProperty({
                          ...newProperty,
                          title: e.target.value,
                        })
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
                  {/* Property Type */}
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type</Label>
                    <select
                      className="border rounded p-2 w-full"
                      id="property_type"
                      value={newProperty.property_type}
                      onChange={(e) =>
                        handlePropertyTypeChange(e.target.value as PropertyType)
                      }
                    >
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>
                  {/* Housing Complex */}
                  <div className="space-y-2">
                    <Label htmlFor="housing_complex">Housing Complex</Label>
                    <select
                      className="border rounded p-2 w-full"
                      value={
                        newProperty.property_type === "house" ||
                        newProperty.property_type === "townhouse"
                          ? ""
                          : newProperty.housing_complex_id || ""
                      }
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
                            housing_complex_id:
                              newProperty.property_type === "house" ||
                              newProperty.property_type === "townhouse"
                                ? ""
                                : e.target.value,
                          });
                        }
                      }}
                      disabled={
                        newProperty.property_type === "house" ||
                        newProperty.property_type === "townhouse"
                      }
                    >
                      {newProperty.property_type === "house" ||
                      newProperty.property_type === "townhouse" ? (
                        <option value="" disabled>
                          Individual House
                        </option>
                      ) : (
                        <>
                          <option value="">Select a complex (optional)</option>
                          {housingComplexes.map((complex) => (
                            <option key={complex.id} value={complex.id}>
                              {complex.name}
                            </option>
                          ))}
                          <option value="new">+ Add New Complex</option>
                        </>
                      )}
                    </select>
                  </div>
                  {/* Verification Document */}
                  <div className="space-y-2">
                    <Label htmlFor="verification_document">
                      Verification Document (Optional)
                    </Label>
                    <input
                      type="file"
                      id="verification_document"
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          verification_document: e.target.files?.[0] || null,
                        })
                      }
                      className="border rounded p-2 w-full"
                    />
                    {newProperty.verification_document && (
                      <div className="mt-2 flex items-center space-x-2">
                        {newProperty.verification_document.type === "application/pdf" ? (
                          <ImageIcon className="h-6 w-6 text-red-500" />
                        ) : (
                          <img
                            src={URL.createObjectURL(newProperty.verification_document)}
                            alt="Verification Preview"
                            className="h-6 w-6 object-cover"
                          />
                        )}
                        <span>{newProperty.verification_document.name}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload an image or PDF for property verification.
                    </p>
                  </div>
                </div>
                {/* Address and Unit Inputs */}
                <AddressInput
                  address={newProperty.address}
                  unit={newProperty.unit}
                  city={newProperty.city}
                  state={newProperty.state}
                  zipCode={newProperty.zip_code}
                  onAddressChange={(value) => setNewProperty((prev) => ({ ...prev, address: value }))}
                  onunitChange={(value) => setNewProperty((prev) => ({ ...prev, unit: value }))}
                  onCityChange={(value) => setNewProperty((prev) => ({ ...prev, city: value }))}
                  onStateChange={(value) => setNewProperty((prev) => ({ ...prev, state: value }))}
                  onZipCodeChange={(value) => setNewProperty((prev) => ({ ...prev, zip_code: value }))}
                />
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit/Apt #</Label>
                  <Input
                    id="unit"
                    value={newProperty.unit}
                    onChange={(e) =>
                      setNewProperty((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="Enter unit or apartment number"
                  />
                </div>
                {/* Price and Lease Details */}
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
                    <Label htmlFor="original_lease_rent">
                      Original Lease Rent (optional)
                    </Label>
                    <Input
                      id="original_lease_rent"
                      type="number"
                      value={newProperty.original_lease_rent || ""}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          original_lease_rent: e.target.value,
                        })
                      }
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sublease_from">Sublease From</Label>
                    <Input
                      id="sublease_from"
                      type="date"
                      value={newProperty.sublease_from}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          sublease_from: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sublease_to">Sublease To</Label>
                    <Input
                      id="sublease_to"
                      type="date"
                      value={newProperty.sublease_to}
                      onChange={(e) =>
                        setNewProperty({
                          ...newProperty,
                          sublease_to: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                {/* Bedrooms, Bathrooms, Square Feet */}
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
                unit={property.unit}
                roomTag={property.roomTag}
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
                      prev.map((p) =>
                        p.id === updatedProperty.id ? updatedProperty : p
                      )
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
                      const { data: files } = await supabase.storage
                        .from("property-media")
                        .list(`${property.id}`, { limit: 100 });
                      if (files && files.length > 0) {
                        const filesToRemove = files.map(
                          (file) => `${property.id}/${file.name}`
                        );
                        await supabase.storage
                          .from("property-media")
                          .remove(filesToRemove);
                        console.log("Removed property media files:", filesToRemove);
                      }
                      const { data: verFiles } = await supabase.storage
                        .from("property-verifications")
                        .list(`${property.id}`, { limit: 100 });
                      if (verFiles && verFiles.length > 0) {
                        const verFilesToRemove = verFiles.map(
                          (file) => `${property.id}/${file.name}`
                        );
                        await supabase.storage
                          .from("property-verifications")
                          .remove(verFilesToRemove);
                        console.log("Removed property verification files:", verFilesToRemove);
                      }
                      setProperties((prev) =>
                        prev.filter((p) => p.id !== property.id)
                      );
                      toast({
                        title: "Success",
                        description: "Property deleted successfully",
                      });
                    } catch (error) {
                      console.error("Error deleting property:", error);
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
