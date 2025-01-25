// hooks/useSavedStatus.ts

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSavedStatus = (propertyId: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSaved(false);
        setLoading(false);
        return;
      }

      const { data: savedProperty } = await supabase
        .from('saved_properties')
        .select()
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .single();

      setIsSaved(!!savedProperty);
    } catch (error) {
      console.error('Error checking saved status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfSaved();
  }, [propertyId]);

  const toggleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (isSaved) {
        // Unlike property
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Like property
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling saved status:', error);
      throw error;
    }
  };

  return { isSaved, loading, toggleSave };
};
