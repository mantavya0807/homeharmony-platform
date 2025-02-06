// src/utils/savedProperties.ts

import { supabase } from "@/integrations/supabase/client";

export const checkIfPropertySaved = async (propertyId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_properties')
      .select('id')
      .match({ 
        user_id: userId,
        property_id: propertyId 
      })
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error code
      console.error('Error checking saved status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking saved status:', error);
    return false;
  }
};

export const toggleSaveProperty = async (propertyId: string, userId: string) => {
  try {
    const isSaved = await checkIfPropertySaved(propertyId, userId);

    if (isSaved) {
      // Unlike property
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .match({ 
          user_id: userId,
          property_id: propertyId 
        });

      if (error) throw error;
      return false;
    } else {
      // Like property
      const { error } = await supabase
        .from('saved_properties')
        .insert({
          user_id: userId,
          property_id: propertyId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('Error toggling saved status:', error);
    throw error;
  }
};