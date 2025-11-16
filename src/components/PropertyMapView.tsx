// components/PropertyMapView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Loader2, MapIcon } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useTheme } from 'next-themes';

const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse'];

const darkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

interface Property {
  id: string;
  seller_id?: string;
  title: string;
  description?: string;
  price: number;
  property_type: "house" | "apartment" | "condo" | "townhouse";
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  images: string[];
  is_verified?: boolean;
  verification_document_url?: string;
  status?: string;
  unit?: string;
  isSaved?: boolean;
  click_count?: number;
  sublease_from?: string;
  sublease_to?: string;
  seller_name?: string;
  seller_avatar_url?: string;
  seller_rating?: number;
  lat?: number;
  lng?: number;
}

function getMarkerIcon(property: any, theme: string) {
  const price = property.price;
  const priceText = price < 1000 ? `$${price}` : `$${Math.round(price / 1000)}k`;
  
  // Simplified SVG without filters for better compatibility
  const bgColor = theme === 'dark' ? '#3b82f6' : '#1e40af'; // Blue
  const textColor = '#ffffff'; // Always white for contrast
  
  let svg;
  switch (property.property_type) {
    case 'house':
      svg = `<svg width="70" height="80" viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M35 10 L60 35 L55 35 L55 65 L15 65 L15 35 L10 35 Z" fill="${bgColor}" stroke="#fff" stroke-width="2"/>
          <rect x="25" y="45" width="20" height="20" fill="rgba(255,255,255,0.3)"/>
          <text x="35" y="57" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="bold" font-family="Arial">${priceText}</text>
        </g>
      </svg>`;
      break;
    case 'apartment':
      svg = `<svg width="70" height="80" viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg">
        <g>
          <rect x="15" y="15" width="40" height="50" rx="4" fill="${bgColor}" stroke="#fff" stroke-width="2"/>
          <rect x="20" y="25" width="30" height="30" fill="rgba(255,255,255,0.3)"/>
          <text x="35" y="45" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="bold" font-family="Arial">${priceText}</text>
        </g>
      </svg>`;
      break;
    case 'condo':
      svg = `<svg width="70" height="80" viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle cx="35" cy="40" r="25" fill="${bgColor}" stroke="#fff" stroke-width="2"/>
          <text x="35" y="45" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="bold" font-family="Arial">${priceText}</text>
        </g>
      </svg>`;
      break;
    case 'townhouse':
      svg = `<svg width="70" height="80" viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M15 50 L35 20 L55 50 L55 65 L15 65 Z" fill="${bgColor}" stroke="#fff" stroke-width="2"/>
          <rect x="25" y="45" width="20" height="20" fill="rgba(255,255,255,0.3)"/>
          <text x="35" y="57" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="bold" font-family="Arial">${priceText}</text>
        </g>
      </svg>`;
      break;
    default:
      svg = `<svg width="70" height="80" viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle cx="35" cy="40" r="25" fill="${bgColor}" stroke="#fff" stroke-width="2"/>
          <text x="35" y="45" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="bold" font-family="Arial">${priceText}</text>
        </g>
      </svg>`;
  }
  
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(70, 80),
    anchor: new window.google.maps.Point(35, 75),
  };
}

function getDetailedStreetViewIcon(property: any, theme: string) {
  const price = property.price;
  const priceText = price < 1000 ? `$${price}` : `$${Math.round(price / 1000)}k`;
  const typeInitial = property.property_type.charAt(0).toUpperCase();
  const svg = `
    <svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="dropShadow" x="0" y="0" width="150%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
          <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="5" y="5" width="60" height="60" rx="10" ry="10"
        fill="${theme === 'dark' ? '#718096' : '#1a365d'}"
        stroke="white" stroke-width="3" filter="url(#dropShadow)"/>
      <text x="35" y="30" text-anchor="middle"
        fill="${theme === 'dark' ? 'black' : 'white'}" font-size="16" font-family="Arial" font-weight="bold">
        ${typeInitial}
      </text>
      <text x="35" y="50" text-anchor="middle"
        fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial">
        ${priceText} AR
      </text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(70, 70),
    anchor: new window.google.maps.Point(35, 35),
  };
}

// Group properties by address (used for marker creation)
function groupProperties(properties: any[]) {
  return properties.reduce((acc: Record<string, any[]>, p) => {
    const key = `${p.address.trim().toLowerCase()}_${p.city.trim().toLowerCase()}_${p.state.trim().toLowerCase()}_${p.zip_code.trim()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}

interface MapAndListViewProps {
  properties: Property[];
  // Instead of auto-fitting bounds to markers, we accept a center (from the search or user location)
  center?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  onSaveToggle?: (propertyId: string) => Promise<void>;
}

export default function MapAndListView({ properties, center, userLocation, onSaveToggle }: MapAndListViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>('roadmap');
  const [filterTypes, setFilterTypes] = useState([...PROPERTY_TYPES]);
  const [propertiesWithLocation, setPropertiesWithLocation] = useState<
    { property: any; location: google.maps.LatLng }[]
  >([]);
  const [visibleProperties, setVisibleProperties] = useState<
    { property: any; location: google.maps.LatLng }[]
  >([]);

  const { isLoaded, error } = useGoogleMaps();
  const { theme } = useTheme();

  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize the map using the provided center (or userLocation or default to State College)
  useEffect(() => {
    if (!isLoaded) return;
    const mapElem = document.getElementById('property-map');
    if (!mapElem) return;

    // Use the passed center, or userLocation if available, or default to State College (40.7934, -77.8600)
    const initialCenter = center || userLocation || { lat: 40.7934, lng: -77.8600 };
    const mapOptions: google.maps.MapOptions = {
      center: initialCenter,
      zoom: 16,
      mapTypeId: mapType,
      styles: theme === 'dark' ? darkStyle : [],
      gestureHandling: "greedy",
      streetViewControl: false,
      disableDefaultUI: false,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      fullscreenControl: false,
    };

    const mapInstance = new window.google.maps.Map(mapElem, mapOptions);
    
    // Completely disable street view
    const streetView = mapInstance.getStreetView();
    if (streetView) {
      streetView.setVisible(false);
      google.maps.event.addListener(streetView, 'visible_changed', () => {
        if (streetView.getVisible()) {
          streetView.setVisible(false);
        }
      });
    }
    
    setMap(mapInstance);
    setMapLoaded(true);
  }, [isLoaded, center, userLocation, mapType, theme]);

  // When the center prop changes, animate (pan) to the new center.
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);

  // Create markers for properties (using geocoding when needed)
  useEffect(() => {
    if (!map || !mapLoaded) return;
    // Clear previous markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    const filteredProperties = properties.filter((p) =>
      filterTypes.includes(p.property_type)
    );
    const grouped = groupProperties(filteredProperties);
    const promises = Object.keys(grouped).map((key) => {
      const group = grouped[key];
      const sample = group[0];
      const address = `${sample.address}, ${sample.city}, ${sample.state} ${sample.zip_code}`;
      return new Promise<{ propWithLoc: { property: any; location: google.maps.LatLng }[] }>((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const position = results[0].geometry.location;
            const icon = getMarkerIcon(sample, theme || 'light');

            const marker = new window.google.maps.Marker({
              position,
              map,
              title: sample.title,
              icon,
              animation: window.google.maps.Animation.DROP,
            });
            marker.addListener('click', () => {
              map.panTo(position);
            });
            newMarkers.push(marker);
            const propWithLoc = group.map((prop: any) => ({ property: prop, location: position }));
            resolve({ propWithLoc });
          } else {
            resolve({ propWithLoc: [] });
          }
        });
      });
    });
    Promise.all(promises).then((results) => {
      const propertyLocations = results.flatMap(r => r.propWithLoc);
      // Remove duplicate entries based on property id
      const unique = propertyLocations.reduce((acc, curr) => {
         if (!acc.find((item: any) => item.property.id === curr.property.id)) {
           acc.push(curr);
         }
         return acc;
      }, [] as { property: any; location: google.maps.LatLng }[]);
      setPropertiesWithLocation(unique);
    });
    setMarkers(newMarkers);
    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, mapLoaded, properties, filterTypes, theme]);

  // Update the list of visible properties based on the map’s bounds.
  useEffect(() => {
    if (map) {
      const updateVisibleProperties = () => {
        const bounds = map.getBounds();
        if (bounds && propertiesWithLocation.length > 0) {
          const visible = propertiesWithLocation.filter((item) =>
            bounds.contains(item.location)
          );
          setVisibleProperties(visible);
        }
      };
      const listener = map.addListener('idle', updateVisibleProperties);
      updateVisibleProperties();
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, propertiesWithLocation]);

  /* ===== Custom Map Controls ===== */
  useEffect(() => {
    if (!map) return;

    // ----- Zoom Controls (Plus/Minus) -----
    const zoomControlDiv = document.createElement('div');
    zoomControlDiv.style.margin = '10px';
    zoomControlDiv.style.background = theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255,255,255,0.95)';
    zoomControlDiv.style.borderRadius = '8px';
    zoomControlDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    zoomControlDiv.style.display = 'flex';
    zoomControlDiv.style.flexDirection = 'column';
    zoomControlDiv.style.overflow = 'hidden';

    // Zoom In Button
    const zoomInButton = document.createElement('button');
    zoomInButton.innerHTML = '+';
    zoomInButton.style.border = 'none';
    zoomInButton.style.background = 'transparent';
    zoomInButton.style.padding = '10px 15px';
    zoomInButton.style.cursor = 'pointer';
    zoomInButton.style.fontSize = '18px';
    zoomInButton.style.fontWeight = 'bold';
    zoomInButton.style.color = theme === 'dark' ? '#fff' : '#000';
    zoomInButton.style.transition = 'background 0.2s';
    zoomInButton.onmouseenter = () => {
      zoomInButton.style.background = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
    };
    zoomInButton.onmouseleave = () => {
      zoomInButton.style.background = 'transparent';
    };
    zoomControlDiv.appendChild(zoomInButton);

    // Divider
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.background = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    zoomControlDiv.appendChild(divider);

    // Zoom Out Button
    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerHTML = '−';
    zoomOutButton.style.border = 'none';
    zoomOutButton.style.background = 'transparent';
    zoomOutButton.style.padding = '10px 15px';
    zoomOutButton.style.cursor = 'pointer';
    zoomOutButton.style.fontSize = '18px';
    zoomOutButton.style.fontWeight = 'bold';
    zoomOutButton.style.color = theme === 'dark' ? '#fff' : '#000';
    zoomOutButton.style.transition = 'background 0.2s';
    zoomOutButton.onmouseenter = () => {
      zoomOutButton.style.background = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
    };
    zoomOutButton.onmouseleave = () => {
      zoomOutButton.style.background = 'transparent';
    };
    zoomControlDiv.appendChild(zoomOutButton);

    zoomInButton.addEventListener('click', () => {
      map.setZoom(map.getZoom() + 1);
    });
    zoomOutButton.addEventListener('click', () => {
      map.setZoom(map.getZoom() - 1);
    });

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomControlDiv);
  }, [map, theme]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Error loading map. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full rounded-lg overflow-hidden shadow-xl border border-blue-100 dark:border-white/10">
      {/* Left side: Map - 60% width */}
      <div className="w-3/5 relative">
        <div id="property-map" ref={mapRef} className="absolute inset-0" />
        
        {/* Overlay: Property Type Filters */}
        <div className="absolute top-4 left-4 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 dark:border-white/10 z-10">
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Filter by Type</h3>
          <div className="flex flex-col space-y-2">
            {PROPERTY_TYPES.map((type) => {
              const icon = getMarkerIcon({ price: 0, property_type: type }, theme || 'light');
              return (
                <Button
                  key={type}
                  variant={filterTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  className={`flex items-center gap-2 justify-start ${
                    filterTypes.includes(type)
                      ? 'bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 text-white'
                      : 'hover:bg-blue-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    if (filterTypes.includes(type)) {
                      setFilterTypes(filterTypes.filter((t) => t !== type));
                    } else {
                      setFilterTypes([...filterTypes, type]);
                    }
                  }}
                >
                  <img
                    src={icon.url}
                    alt={type}
                    className="w-5 h-5"
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Overlay: Map Type Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-blue-100 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-gray-800 shadow-lg"
            onClick={() => {
              const newType =
                mapType === google.maps.MapTypeId.ROADMAP
                  ? google.maps.MapTypeId.SATELLITE
                  : google.maps.MapTypeId.ROADMAP;
              setMapType(newType);
              if (map) {
                map.setMapTypeId(newType);
              }
            }}
          >
            {mapType === google.maps.MapTypeId.ROADMAP ? '🛰️ Satellite' : '🗺️ Map'}
          </Button>
        </div>
      </div>

      {/* Right side: Property Cards List - 40% width */}
      <div className="w-2/5 overflow-y-auto bg-gradient-to-b from-blue-50/30 via-background to-background dark:from-background dark:to-background">
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-blue-100 dark:border-white/10 p-4 shadow-sm">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
            Properties in View
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {visibleProperties.length} {visibleProperties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>

        {visibleProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 dark:bg-gray-800 flex items-center justify-center">
              <MapIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">No properties in view</p>
            <p className="text-sm text-muted-foreground">Try zooming out or panning the map to see more properties</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {visibleProperties.map((item, index) => (
              <PropertyCard
                key={item.property.id || index}
                id={item.property.id}
                title={item.property.title}
                description={item.property.description}
                price={item.property.price}
                property_type={item.property.property_type}
                bedrooms={item.property.bedrooms}
                bathrooms={item.property.bathrooms}
                square_feet={item.property.square_feet}
                address={item.property.address}
                city={item.property.city}
                state={item.property.state}
                zip_code={item.property.zip_code}
                images={item.property.images || []}
                sublease_from={item.property.sublease_from}
                sublease_to={item.property.sublease_to}
                is_verified={item.property.is_verified}
                verification_document_url={item.property.verification_document_url}
                isSaved={item.property.isSaved}
                sellerId={item.property.seller_id}
                sellerName={item.property.seller_name}
                sellerAvatarUrl={item.property.seller_avatar_url}
                sellerRating={item.property.seller_rating}
                click_count={item.property.click_count}
                status={item.property.status}
                onSaveToggle={onSaveToggle ? () => onSaveToggle(item.property.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
