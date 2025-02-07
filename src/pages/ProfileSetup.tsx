import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileSetupProps {
  userId: string;
  userRole: 'buyer' | 'seller';
  onComplete: () => void;
}

export default function ProfileSetup({ userId, userRole, onComplete }: ProfileSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    phone_number: '',
    bio: '',
  });

  const handleAvatarUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
  
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
  
    if (uploadError) throw uploadError;
  
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
  
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = null;

      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        // Upload avatar image
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile setup completed successfully",
      });

      onComplete();
      navigate(userRole === 'seller' ? '/seller-dashboard' : '/dashboard');
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Add some details to help others get to know you better
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              {avatar ? (
                <AvatarImage src={URL.createObjectURL(avatar)} />
              ) : (
                <AvatarFallback>Upload</AvatarFallback>
              )}
            </Avatar>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="max-w-xs"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder={
                userRole === 'seller'
                  ? "Tell us about your experience in real estate..."
                  : "Share a bit about yourself..."
              }
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
            />
          </div>

          {/* Seller Specific Fields */}
          {userRole === 'seller' && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-4">
                As a seller, you'll need to connect your Stripe account to receive payments.
                You can do this now or later from your dashboard.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/stripe-connect')}
              >
                Connect Stripe Account
              </Button>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigate(userRole === 'seller' ? '/seller-dashboard' : '/dashboard');
                onComplete();
              }}
            >
              Skip for Now
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}