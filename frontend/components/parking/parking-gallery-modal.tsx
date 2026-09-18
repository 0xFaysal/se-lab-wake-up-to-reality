"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ParkingGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: {
    src: string;
    alt: string;
    caption: string;
  }[];
  initialIndex?: number;
}

export function ParkingGalleryModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ParkingGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  function prev() {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function next() {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full max-w-5xl h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 z-10 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          aria-label="Close photo gallery"
        >
          <X className="size-6" />
        </button>

        {/* Counter */}
        <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold rounded-full font-heading">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Main Image Container */}
        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-contain"
            priority
          />

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

        {/* Caption & Thumbnails */}
        <div className="w-full mt-4 flex items-center justify-between text-white/90">
          <p className="text-sm font-medium">{images[currentIndex].caption}</p>

          <div className="flex gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative size-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "border-primary scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
