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
  imageClassName?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ photos, className, imageClassName }) => {
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
        <SwiperSlide key={`photo-${index}-${url}`} className="w-full h-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <img
            src={url}
            alt={`Property Photo ${index + 1}`}
            className={`w-full h-full object-cover object-center ${imageClassName || ''}`}
            loading={index === 0 ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
            }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageGallery;
