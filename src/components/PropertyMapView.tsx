// components/MapAndListView.tsx
import React, { useState, useEffect } from 'react';
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

function groupProperties(properties: any[]) {
  return properties.reduce((acc: Record<string, any[]>, p) => {
    const key = `${p.address.trim().toLowerCase()}_${p.city.trim().toLowerCase()}_${p.state.trim().toLowerCase()}_${p.zip_code.trim()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}

interface MapAndListViewProps {
  properties: any[];
  userLocation?: { lat: number; lng: number };
}

export default function MapAndListView({ properties, userLocation }: MapAndListViewProps) {
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

  // Initialize the map – if there are properties, fit bounds; otherwise, if a userLocation is provided, center there.
  useEffect(() => {
    if (!isLoaded) return;
    const mapElem = document.getElementById('property-map');
    if (!mapElem) return;

    const mapOptions: google.maps.MapOptions = {
      disableDefaultUI: true,
      zoom: 12,
      mapTypeId: mapType,
      styles: theme === 'dark' ? darkStyle : [],
    };

    const mapInstance = new window.google.maps.Map(mapElem, mapOptions);

    if (properties.length > 0) {
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      const geocodePromises = properties.map((p) => {
        return new Promise((resolve) => {
          const address = `${p.address}, ${p.city}, ${p.state} ${p.zip_code}`;
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              bounds.extend(results[0].geometry.location);
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });
      });
      Promise.all(geocodePromises).then(() => {
        mapInstance.fitBounds(bounds);
        const listener = mapInstance.addListener('idle', () => {
          if (mapInstance.getZoom() < 16) {
            mapInstance.setZoom(16);
          }
          google.maps.event.removeListener(listener);
        });
      });
    } else if (userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(16);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapInstance.setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        mapInstance.setZoom(16);
      });
    }

    setMap(mapInstance);
    setMapLoaded(true);
  }, [isLoaded, properties, mapType, theme, userLocation]);

  // Create markers and collect property locations without duplicating entries.
  useEffect(() => {
    if (!map || !mapLoaded) return;
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    const geocoder = new window.google.maps.Geocoder();
    const filteredProperties = properties.filter((p) =>
      filterTypes.includes(p.property_type)
    );
    const grouped = groupProperties(filteredProperties);
    const promises = Object.keys(grouped).map((key) => {
      const group = grouped[key];
      const sample = group[0];
      const address = `${sample.address}, ${sample.city}, ${sample.state} ${sample.zip_code}`;
      return new Promise<{ propWithLoc: { property: any; location: google.maps.LatLng }[] }>((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const position = results[0].geometry.location;
            const icon = streetViewActive
              ? getDetailedStreetViewIcon(sample, theme || 'light')
              : getMarkerIcon(sample, theme || 'light');
            const marker = new window.google.maps.Marker({
              position,
              map,
              title: sample.title,
              icon,
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

  const handleStreetViewToggle = () => {
    if (!map) return;
    const streetView = map.getStreetView();
    if (!streetViewActive) {
      const center = map.getCenter();
      streetView.setPosition(center);
      streetView.setPov({ heading: 0, pitch: 0 });
      streetView.setVisible(true);
    } else {
      streetView.setVisible(false);
    }
    setStreetViewActive(!streetViewActive);
  };

  useEffect(() => {
    if (map && streetViewActive) {
      const clickListener = map.addListener('click', (e) => {
        const streetView = map.getStreetView();
        streetView.setPosition(e.latLng);
      });
      const dragendListener = map.addListener('dragend', () => {
        const streetView = map.getStreetView();
        streetView.setPosition(map.getCenter());
      });
      return () => {
        google.maps.event.removeListener(clickListener);
        google.maps.event.removeListener(dragendListener);
      };
    }
  }, [map, streetViewActive]);

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
        <div id="property-map" className="absolute inset-0" />
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
        {/* Overlay: Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          <Button
            variant="outline"
            className="bg-background/90 backdrop-blur-sm"
            onClick={handleStreetViewToggle}
          >
            {streetViewActive ? 'Exit Street View' : 'Street View'}
          </Button>
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
