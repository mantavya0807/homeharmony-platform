import { useState, useEffect } from 'react';

declare global {
  interface Window {
    google: any;
    __googleMapsCallback?: () => void;
  }
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If already loaded, set the flag and return early.
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const callbackName = '__googleMapsCallback';
    window[callbackName] = () => {
      setIsLoaded(true);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    // Use one consistent API key here
    const apiKey = 'AIzaSyBc9lsvGxCCrT0cvi2o1nm1LyISnz3y_Lo';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setError(new Error('Failed to load Google Maps script'));
      delete window[callbackName];
    };

    document.head.appendChild(script);

    return () => {
      delete window[callbackName];
    };
  }, []);

  return { isLoaded, error };
}
