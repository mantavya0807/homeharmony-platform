// src/utils/trackPropertyClick.ts

import { supabase } from '@/integrations/supabase/client';
import { getApiUrl } from '@/lib/apiConfig';

export const trackPropertyClick = async (propertyId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get location from user profile instead of prompting each time
    let latitude = null;
    let longitude = null;
    
    // Location tracking disabled - columns don't exist in profiles table
    // Can be re-enabled if location_latitude/location_longitude columns are added

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/property-clicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        property_id: propertyId,
        user_id: session?.user?.id,
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track click: ${response.statusText}`);
    }

  } catch (error) {
    console.error('Error tracking property click:', error);
    // Don't throw to prevent breaking navigation
  }
};