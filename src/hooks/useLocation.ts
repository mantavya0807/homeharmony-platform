// src/hooks/useLocation.ts

import { useState, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const { latitude, longitude } = JSON.parse(savedLocation);
      setState({
        latitude,
        longitude,
        error: null,
        loading: false,
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Save to localStorage
        localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
        setState({
          latitude,
          longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    );
  }, []);

  return state;
};