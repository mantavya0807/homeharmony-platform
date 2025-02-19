// src/components/ImageGallery.tsx

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ImageGalleryProps {
  photos: string[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ photos, className }) => {
  const validPhotos = photos.filter(url => url && typeof url === 'string');

  if (!validPhotos || validPhotos.length === 0) {
    return (
      <div className="h-[400px] w-full bg-muted flex items-center justify-center rounded-t-lg">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={0}
      slidesPerView={1}
      className={`w-full ${className ? className : "h-[400px]"} rounded-t-lg relative overflow-hidden`}
    >
      {validPhotos.map((url, index) => (
        <SwiperSlide key={`photo-${index}-${url}`} className="w-full h-full">
          <img
            src={url}
            alt={`Property Photo ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageGallery;
