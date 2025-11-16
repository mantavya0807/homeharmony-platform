// src/components/InteractiveMapWithPlaces.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { AlertCircle, MapPin, UtensilsCrossed, ShoppingBag, Coffee, School, TreePalm } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  vicinity?: string;
  location?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  types?: string[];
  categoryName?: string; // 'dining', 'shopping', 'coffee', 'education', 'parks'
}

interface InteractiveMapWithPlacesProps {
  center: {
    lat: number;
    lng: number;
  };
  places?: Place[];
  propertyAddress?: string;
  className?: string;
}

interface CategoryInfo {
  name: string;
  color: string;
  icon: string;
  count: number;
}

export default function InteractiveMapWithPlaces({
  center,
  places = [],
  propertyAddress,
  className = ''
}: InteractiveMapWithPlacesProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const { isLoaded, error } = useGoogleMaps();
  const [mapError, setMapError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>({});

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;

      // Add center marker (property location) - professional home icon
      const centerMarker = new google.maps.Marker({
        position: center,
        map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#DC2626" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 48)
        },
        title: 'Property Location',
        zIndex: 1000
      });

      markersRef.current.push(centerMarker);

      // Create info window - ultra small and compact
      const infoWindow = new google.maps.InfoWindow({
        maxWidth: 150,
        pixelOffset: new google.maps.Size(0, -5)
      });
      infoWindowRef.current = infoWindow;
      
      // Style the close button to be visible (dark instead of white)
      google.maps.event.addListener(infoWindow, 'domready', () => {
        const iwCloseBtn = document.querySelector('.gm-ui-hover-effect');
        if (iwCloseBtn) {
          (iwCloseBtn as HTMLElement).style.opacity = '1';
          (iwCloseBtn as HTMLElement).style.background = '#374151';
          (iwCloseBtn as HTMLElement).style.width = '20px';
          (iwCloseBtn as HTMLElement).style.height = '20px';
          (iwCloseBtn as HTMLElement).style.borderRadius = '2px';
          (iwCloseBtn as HTMLElement).style.top = '2px';
          (iwCloseBtn as HTMLElement).style.right = '2px';
        }
        // Make the X icon visible
        const closeImg = document.querySelector('.gm-ui-hover-effect img');
        if (closeImg) {
          (closeImg as HTMLElement).style.filter = 'brightness(0) invert(1)';
          (closeImg as HTMLElement).style.width = '12px';
          (closeImg as HTMLElement).style.height = '12px';
        }
      });

      // Add center marker info - minimal size
      centerMarker.addListener('click', () => {
        infoWindow.setContent(`
          <div style="padding: 3px 5px; background: white;">
            <h3 style="font-weight: 600; color: #1F2937; margin: 0 0 1px 0; font-size: 9px; line-height: 1;">Property</h3>
            <p style="font-size: 7px; color: #6B7280; margin: 0; line-height: 1.1;">${propertyAddress || 'Property address'}</p>
          </div>
        `);
        infoWindow.open(map, centerMarker);
      });

      // Add place markers with proper icons
      if (places && places.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(center);

        // Track categories for legend
        const categoryCounts: Record<string, CategoryInfo> = {};

        places.forEach((place, index) => {
          if (!place.location) return;

          // Determine marker category and icon - use categoryName if available
          const categoryInfo = getCategoryInfo(place.categoryName, place.types);
          
          // Update category count
          if (categoryCounts[categoryInfo.name]) {
            categoryCounts[categoryInfo.name].count++;
          } else {
            categoryCounts[categoryInfo.name] = { ...categoryInfo, count: 1 };
          }

          const marker = new google.maps.Marker({
            position: place.location,
            map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(categoryInfo.icon),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32)
            },
            title: place.name,
            animation: google.maps.Animation.DROP,
            optimized: true
          });

          markersRef.current.push(marker);
          bounds.extend(place.location);

          // Add click listener for info window - minimal size
          marker.addListener('click', () => {
            const content = `
              <div style="padding: 3px 5px; background: white;">
                <h3 style="font-weight: 600; margin: 0; font-size: 9px; color: #1F2937; line-height: 1;">${place.name}</h3>
                ${place.vicinity ? `<p style="font-size: 7px; color: #6B7280; margin: 1px 0 0 0; line-height: 1.1;">${place.vicinity}</p>` : ''}
                ${place.rating ? `<div style="display: flex; align-items: center; gap: 2px; font-size: 7px; line-height: 1; margin-top: 1px;">
                  <span style="font-size: 9px;">⭐</span>
                  <span style="font-weight: 600; color: #1F2937;">${place.rating.toFixed(1)}</span>
                </div>` : ''}
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
          });
        });

        // Update categories state for legend
        setCategories(categoryCounts);

        // Fit bounds to show all markers
        map.fitBounds(bounds);
        
        // Prevent too much zoom
        const listener = google.maps.event.addListener(map, 'idle', () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 16) {
            map.setZoom(16);
          }
          google.maps.event.removeListener(listener);
        });
      }

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to load map');
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [isLoaded, center, places]);

  const getCategoryInfo = (categoryName?: string, types?: string[]): CategoryInfo => {
    // If category name is provided from backend, use it directly
    if (categoryName) {
      switch (categoryName.toLowerCase()) {
        case 'dining':
          return {
            name: 'Dining',
            color: '#EF4444',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
            count: 0
          };
        case 'coffee':
          return {
            name: 'Coffee',
            color: '#92400E',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#92400E" stroke="white" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
            count: 0
          };
        case 'shopping':
          return {
            name: 'Shopping',
            color: '#8B5CF6',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#8B5CF6" stroke="white" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
            count: 0
          };
        case 'education':
          return {
            name: 'Education',
            color: '#3B82F6',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
            count: 0
          };
        case 'parks':
          return {
            name: 'Parks',
            color: '#10B981',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#10B981" stroke="white" stroke-width="2"><path d="M12 13v8"/><path d="m7 7 5-5 5 5"/><path d="m17 11 3 3v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4l3-3"/><path d="m12 2 0 6"/><path d="m13 19 4 2"/><path d="m11 19-4 2"/></svg>`,
            count: 0
          };
      }
    }
    
    // Fallback to type-based detection
    if (!types || types.length === 0) {
      return {
        name: 'Other',
        color: '#6B7280',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#6B7280" stroke="white" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
        count: 0
      };
    }
    
    // Restaurant/Dining
    if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway') || types.includes('meal_delivery')) {
      return {
        name: 'Dining',
        color: '#EF4444',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
        count: 0
      };
    }
    
    // Coffee/Cafe
    if (types.includes('cafe') || types.includes('coffee')) {
      return {
        name: 'Coffee',
        color: '#92400E',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#92400E" stroke="white" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
        count: 0
      };
    }
    
    // Shopping
    if (types.includes('shopping_mall') || types.includes('store') || types.includes('clothing_store')) {
      return {
        name: 'Shopping',
        color: '#8B5CF6',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#8B5CF6" stroke="white" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
        count: 0
      };
    }
    
    // Education
    if (types.includes('school') || types.includes('university') || types.includes('library')) {
      return {
        name: 'Education',
        color: '#3B82F6',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
        count: 0
      };
    }
    
    // Parks
    if (types.includes('park') || types.includes('campground')) {
      return {
        name: 'Parks',
        color: '#10B981',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#10B981" stroke="white" stroke-width="2"><path d="M12 13v8"/><path d="m7 7 5-5 5 5"/><path d="m17 11 3 3v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4l3-3"/><path d="m12 2 0 6"/><path d="m13 19 4 2"/><path d="m11 19-4 2"/></svg>`,
        count: 0
      };
    }
    
    // Default
    return {
      name: 'Other',
      color: '#6B7280',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#6B7280" stroke="white" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
      count: 0
    };
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className={className} />;
  }

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px' }}>
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
      
      {/* Map Legend */}
      {Object.keys(categories).length > 0 && (
        <Card className="absolute top-4 right-4 p-3 shadow-lg max-w-[200px] z-10 bg-white/95 backdrop-blur-sm">
          <h4 className="font-semibold text-sm mb-3 text-gray-900">Map Legend</h4>
          <div className="space-y-2">
            {/* Property marker - RED HOUSE */}
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#DC2626" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="text-xs text-gray-700 font-medium">Property</span>
            </div>
            
            {/* Category markers */}
            {Object.entries(categories)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([key, cat]) => (
                <div key={key} className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-700">{cat.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {cat.count}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

