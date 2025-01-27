// src/components/ImageGallery.tsx

import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Navigation, Pagination } from 'swiper/modules'

interface ImageGalleryProps {
  photos: string[]
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ photos }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={10}
      slidesPerView={1}
      className="w-full h-40 rounded-md mb-4"
    >
      {photos.map((url, index) => (
        <SwiperSlide key={index}>
          <img
            src={url}
            alt={`Housing Complex Photo ${index + 1}`}
            className="w-full h-full object-cover rounded-md"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default ImageGallery
