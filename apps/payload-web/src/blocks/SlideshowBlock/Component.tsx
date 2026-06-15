"use client"

import React, { useState, useEffect } from "react"
import type { Media } from "@/payload-types"

export type SlideshowBlockType = {
  blockType?: "slideshowBlock"
  images: {
    image: Media | number | string
  }[]
}

export const SlideshowBlock: React.FC<SlideshowBlockType> = ({ images }) => {
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    if (!images || images.length <= 1) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % images.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [images])

  if (!images || images.length === 0) return null

  return (
    <div className="w-full my-8">
      <div className="relative w-full h-[320px] md:h-[480px] bg-gray-100 rounded-lg overflow-hidden shadow-md">
        {images.map((item, index) => {
          const media = item.image
          if (typeof media !== "object" || !media) return null
          const url = media.url
          const alt = media.alt || ""
          return (
            <div
              key={media.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url || ""} alt={alt} className="w-full h-full object-cover" />
            </div>
          )
        })}
        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((item, index) => {
              const media = item.image
              if (typeof media !== "object" || !media) return null
              return (
                <button
                  key={media.id || index}
                  onClick={() => setSlideIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === slideIndex ? "bg-white scale-125" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
