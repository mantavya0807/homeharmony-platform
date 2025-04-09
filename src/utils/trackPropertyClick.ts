// src/utils/trackPropertyClick.ts

import { supabase } from '@/integrations/supabase/client';

const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api'; // changed from 8080 to 4000
  }
  return 'https://sub-space.me/api';
};

export const trackPropertyClick = async (propertyId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get location from user profile instead of prompting each time
    let latitude = null;
    let longitude = null;
    
    if (session?.user) {
      try {
        // Get stored location from user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('location_latitude, location_longitude')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          latitude = profileData.location_latitude;
          longitude = profileData.location_longitude;
        }
      } catch (error) {
        console.log('Error getting profile location:', error);
      }
    }

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