"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Media } from "@/payload-types"

import { getBestMediaUrl } from "@/utilities/getBestMediaUrl"

export type SlideshowBlockType = {
  blockType?: "slideshowBlock"
  media?: (Media | number | string)[]
  images?: {
    image: Media | number | string
  }[]
}

export const SlideshowBlock: React.FC<SlideshowBlockType> = ({ media, images }) => {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const mediaList: Media[] = []
  if (Array.isArray(media)) {
    media.forEach((item) => {
      if (item && typeof item === "object") mediaList.push(item as Media)
    })
  }
  if (mediaList.length === 0 && Array.isArray(images)) {
    images.forEach((item) => {
      if (item && item.image && typeof item.image === "object") mediaList.push(item.image as Media)
    })
  }

  const count = mediaList.length

  useEffect(() => {
    if (count <= 1 || isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % count)
    }, 4500)
    return () => clearInterval(timer)
  }, [count, isPaused])

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    if (count <= 1) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [count])

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
    <div className="container my-8">
      <div
        className="relative w-full h-[320px] sm:h-[400px] md:h-[500px] bg-transparent rounded-2xl overflow-hidden group select-none touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {mediaList.map((media, index) => {
          const url = getBestMediaUrl(media, "large")
          const alt = media.alt || `Slide ${index + 1}`
          return (
            <div
              key={`${media.id || "media"}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${
                index === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Main uncropped full image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url || ""}
                alt={alt}
                className="relative max-w-full max-h-full object-contain z-10 rounded-xl"
              />
            </div>
          )
        })}

        {/* Previous / Next Arrow Controls */}
        {count > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Slide Indicators / Dots */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md">
            {mediaList.map((media, index) => {
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
