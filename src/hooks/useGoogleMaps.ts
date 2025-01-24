import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Type declaration for window object with google maps
declare global {
  interface Window {
    google: {
      maps: any;
    };
  }
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the script is already loaded, don't load it again
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I&libraries=places`;
    script.async = true;
    script.defer = true;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setError(new Error('Failed to load Google Maps script'));

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      // Don't remove the script from the DOM as it might be used by other components
    };
  }, []);

  return { isLoaded, error };
}