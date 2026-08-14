"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Media } from "@/payload-types"

export type SlideshowBlockType = {
  blockType?: "slideshowBlock"
  images: {
    image: Media | number | string
  }[]
}

export const SlideshowBlock: React.FC<SlideshowBlockType> = ({ images }) => {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const validImages = (images || []).filter(
    (item) => item && item.image && typeof item.image === "object",
  )

  const count = validImages.length

  useEffect(() => {
    if (count <= 1 || isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % count)
    }, 4500)
    return () => clearInterval(timer)
  }, [count, isPaused])

  if (count === 0) return null

  const handleNext = () => {
    setSlideIndex((prev) => (prev + 1) % count)
  }

  const handlePrev = () => {
    setSlideIndex((prev) => (prev - 1 + count) % count)
  }

  // Swipe handling for smartphones & touch devices
  const minSwipeDistance = 40

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
    setIsPaused(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    setIsPaused(false)
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }
  }

  return (
    <div className="my-8 w-full">
      <div
        className="relative w-full h-[320px] sm:h-[400px] md:h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg group select-none touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {validImages.map((item, index) => {
          const media = item.image as Media
          const url = media.url
          const alt = media.alt || `Slide ${index + 1}`
          return (
            <div
              key={`${media.id || "media"}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url || ""} alt={alt} className="w-full h-full object-cover" />
            </div>
          )
        })}

        {/* Previous / Next Arrow Controls */}
        {count > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Slide Indicators / Dots */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
            {validImages.map((item, index) => {
              const media = item.image as Media
              return (
                <button
                  key={`dot-${media.id || "media"}-${index}`}
                  onClick={() => setSlideIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === slideIndex ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
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
