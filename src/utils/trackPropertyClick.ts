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
    
    let latitude = null;
    let longitude = null;
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.log('Location not available:', error);
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