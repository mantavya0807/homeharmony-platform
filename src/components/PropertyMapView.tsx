// components/PropertyMapView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  lat?: number;
  lng?: number;
  property_type: "house" | "apartment" | "condo" | "townhouse";
  unit?: string;
}

function getMarkerIcon(property: any, theme: string) {
  const price = property.price;
  const priceText = price < 1000 ? `$${price}` : `$${Math.round(price / 1000)}k`;
  let svg;
  // In dark mode we use a lighter blue (#63b3ed) so that black text is visible.
  switch (property.property_type) {
    case 'house':
      svg = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
              <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <polygon points="30,5 55,30 50,30 50,55 10,55 10,30 5,30"
            fill="${theme === 'dark' ? '#63b3ed' : '#2b6cb0'}"
            stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="30" y="48" text-anchor="middle"
            fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial" font-weight="bold">
            ${priceText}
          </text>
        </svg>
      `;
      break;
    case 'apartment':
      svg = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
              <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect x="10" y="10" width="40" height="40" rx="6" ry="6"
            fill="${theme === 'dark' ? '#63b3ed' : '#2b6cb0'}"
            stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="30" y="43" text-anchor="middle"
            fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial" font-weight="bold">
            ${priceText}
          </text>
        </svg>
      `;
      break;
    case 'condo':
      svg = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
              <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="30" cy="30" r="20"
            fill="${theme === 'dark' ? '#63b3ed' : '#2b6cb0'}"
            stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="30" y="35" text-anchor="middle"
            fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial" font-weight="bold">
            ${priceText}
          </text>
        </svg>
      `;
      break;
    case 'townhouse':
      svg = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
              <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M10,45 L30,15 L50,45 L50,55 H10 Z"
            fill="${theme === 'dark' ? '#63b3ed' : '#2b6cb0'}"
            stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="30" y="48" text-anchor="middle"
            fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial" font-weight="bold">
            ${priceText}
          </text>
        </svg>
      `;
      break;
    default:
      svg = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
              <feMerge>
                <feMergeNode in="offsetBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="30" cy="30" r="20"
            fill="${theme === 'dark' ? '#63b3ed' : '#2b6cb0'}"
            stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="30" y="35" text-anchor="middle"
            fill="${theme === 'dark' ? 'black' : 'white'}" font-size="12" font-family="Arial" font-weight="bold">
            ${priceText}
          </text>
        </svg>
      `;
  }
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(60, 60),
    anchor: new window.google.maps.Point(30, 30),
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
}

export default function MapAndListView({ properties, center, userLocation }: MapAndListViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>('roadmap');
  const [filterTypes, setFilterTypes] = useState([...PROPERTY_TYPES]);
  const [streetViewActive, setStreetViewActive] = useState(false);
  const [propertiesWithLocation, setPropertiesWithLocation] = useState<
    { property: any; location: google.maps.LatLng }[]
  >([]);
  const [visibleProperties, setVisibleProperties] = useState<
    { property: any; location: google.maps.LatLng }[]
  >([]);

  const { isLoaded, error } = useGoogleMaps();
  const { theme } = useTheme();

  const mapRef = useRef<HTMLDivElement>(null);

  // For the street view “picker” marker (draggable pin)
  const streetViewMarkerRef = useRef<google.maps.Marker | null>(null);

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
    };

    const mapInstance = new window.google.maps.Map(mapElem, mapOptions);
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
            // Choose marker icon (detailed icon used in Street View mode)
            const icon = streetViewActive
              ? getDetailedStreetViewIcon(sample, theme || 'light')
              : getMarkerIcon(sample, theme || 'light');

            // Use the unit number if available; otherwise, use the first letter of the title.
            const markerLabel = sample.unit ? sample.unit : sample.title.charAt(0);

            const marker = new window.google.maps.Marker({
              position,
              map,
              title: sample.title,
              icon,
              label: {
                text: markerLabel,
                color: "#fff",
                fontSize: "12px",
                fontWeight: "bold",
              },
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
  }, [map, mapLoaded, properties, filterTypes, theme, streetViewActive]);

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
    zoomControlDiv.style.background = 'rgba(255,255,255,0.8)';
    zoomControlDiv.style.borderRadius = '4px';
    zoomControlDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    zoomControlDiv.style.display = 'flex';
    zoomControlDiv.style.flexDirection = 'column';

    // Zoom In Button
    const zoomInButton = document.createElement('button');
    zoomInButton.innerHTML = '+';
    zoomInButton.style.border = 'none';
    zoomInButton.style.background = 'transparent';
    zoomInButton.style.padding = '8px';
    zoomInButton.style.cursor = 'pointer';
    zoomInButton.style.fontSize = '16px';
    zoomControlDiv.appendChild(zoomInButton);

    // Zoom Out Button
    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerHTML = '−';
    zoomOutButton.style.border = 'none';
    zoomOutButton.style.background = 'transparent';
    zoomOutButton.style.padding = '8px';
    zoomOutButton.style.cursor = 'pointer';
    zoomOutButton.style.fontSize = '16px';
    zoomControlDiv.appendChild(zoomOutButton);

    zoomInButton.addEventListener('click', () => {
      map.setZoom(map.getZoom() + 1);
    });
    zoomOutButton.addEventListener('click', () => {
      map.setZoom(map.getZoom() - 1);
    });

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoomControlDiv);

    // ----- Street View Picker Control (Pin Icon) -----
    const streetViewControlDiv = document.createElement('div');
    streetViewControlDiv.style.margin = '10px';
    streetViewControlDiv.style.background = 'rgba(255,255,255,0.8)';
    streetViewControlDiv.style.borderRadius = '4px';
    streetViewControlDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    streetViewControlDiv.style.cursor = 'pointer';
    streetViewControlDiv.style.padding = '8px';
    streetViewControlDiv.title = 'Toggle Street View';
    // Using a Unicode pushpin icon (you can replace this with your own SVG/icon)
    streetViewControlDiv.innerHTML = '&#128205;';
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(streetViewControlDiv);

    streetViewControlDiv.addEventListener('click', () => {
      setStreetViewActive(prev => !prev);
    });
  }, [map]);

  // ----- Handle Street View Mode via a draggable “picker” marker -----
  useEffect(() => {
    if (!map) return;
    const streetView = map.getStreetView();
    if (streetViewActive) {
      // Show Street View panorama and add a draggable marker for choosing the location.
      streetView.setVisible(true);
      if (!streetViewMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: map.getCenter(),
          map: map,
          draggable: true,
          icon: {
            // A simple red pushpin icon (you can replace with your own)
            url:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="red">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.74-2.25 6.19-5 9.88C9.25 15.19 7 11.74 7 9z"/>
                  <circle cx="12" cy="9" r="2.5" fill="red"/>
                </svg>
              `),
            scaledSize: new google.maps.Size(30, 30),
          },
        });
        marker.addListener('dragend', (e) => {
          streetView.setPosition(e.latLng);
        });
        streetViewMarkerRef.current = marker;
      } else {
        streetViewMarkerRef.current.setPosition(map.getCenter());
      }
      // Update the Street View position to match the picker marker.
      streetView.setPosition(streetViewMarkerRef.current.getPosition());
    } else {
      // When Street View mode is disabled, hide the panorama and remove the picker marker.
      streetView.setVisible(false);
      if (streetViewMarkerRef.current) {
        streetViewMarkerRef.current.setMap(null);
        streetViewMarkerRef.current = null;
      }
    }
  }, [streetViewActive, map]);

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
    <div className="flex h-screen">
      {/* Left half: Map */}
      <div className="w-1/2 relative">
        <div id="property-map" ref={mapRef} className="absolute inset-0" />
        {/* Overlay: Filters */}
        <div className="absolute top-4 left-4 p-2 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg z-10">
          <div className="flex flex-col space-y-1">
            {PROPERTY_TYPES.map((type) => {
              const icon = getMarkerIcon({ price: 0, property_type: type }, theme || 'light');
              return (
                <Button
                  key={type}
                  variant={filterTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
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
                    style={{ width: '20px', height: '20px' }}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>
        {/* Overlay: Satellite Toggle (Street View toggle moved to map control) */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            className="bg-background/90 backdrop-blur-sm"
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
            {mapType === google.maps.MapTypeId.ROADMAP ? 'Satellite' : 'Roadmap'}
          </Button>
        </div>
      </div>
      {/* Right half: Property Cards List */}
      <div className="w-1/2 overflow-y-auto p-4 bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Properties in View</h2>
        {visibleProperties.length === 0 ? (
          <p>No properties found in the current area.</p>
        ) : (
          visibleProperties.map((item, index) => (
            <div key={index} className="mb-4">
              <PropertyCard
                id={item.property.id}
                title={item.property.title}
                price={item.property.price}
                location={`${item.property.city}, ${item.property.state}`}
                beds={item.property.bedrooms}
                baths={item.property.bathrooms}
                sqft={item.property.square_feet}
                imageUrl={item.property.images?.[0]}
                sublease_from={item.property.sublease_from}
                sublease_to={item.property.sublease_to}
                is_verified={item.property.is_verified}
                views={item.property.views}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
