import React from "react";

interface GoogleMapProps {
  address: string;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GoogleMap: React.FC<GoogleMapProps> = ({ address, className }) => {
  const encodedAddress = encodeURIComponent(address);
  const mapURL = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}`;
  return (
    <iframe
      title="Google Map"
      src={mapURL}
      width="100%"
      height="500"
      style={{ border: 0, pointerEvents: 'auto' }}
      allowFullScreen
      loading="lazy"
      className={className}
    />
  );
};

export default GoogleMap;
