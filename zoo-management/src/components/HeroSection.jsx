import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { preloadImages } from "../utils/imagePreloader";

// Dynamically import all background images from the backgrounds folder
const backgroundImages = Object.entries(
  import.meta.glob("../assets/images/backgrounds/*.{jpg,jpeg,png,webp}", {
    eager: true,
  })
).map(([path, module]) => ({
  src: module.default,
  alt: path.split("/").pop().split(".")[0].replace(/-/g, " "),
  path,
}));

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(1); // Start at 1 (first real image)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [heroAnimating, setHeroAnimating] = useState(false);
  const heroTimerRef = useRef(null);

  // Create extended array with clones for infinite effect
  const extendedImages = [
    backgroundImages[backgroundImages.length - 1], // Clone of last image
    ...backgroundImages,
    backgroundImages[0], // Clone of first image
  ];

  // Preload background images on mount
  useEffect(() => {
    const imageUrls = backgroundImages.map((img) => img.src).filter(Boolean);
    if (imageUrls.length > 0) {
      // Preload first 3 images immediately, rest after a delay
      preloadImages(imageUrls.slice(0, 3));
      setTimeout(() => {
        preloadImages(imageUrls.slice(3));
      }, 1000);
    }
  }, []);

  const handleNext = () => {
    if (heroAnimating) return;
    // start transition and guard rapid clicks
    setHeroAnimating(true);
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => prev + 1);
    setLastInteraction(Date.now());
    // clear animating after transition + small buffer (matches 750ms transition)
    heroTimerRef.current = setTimeout(() => {
      setHeroAnimating(false);
      heroTimerRef.current = null;
    }, 820);
  };

  const handlePrevious = () => {
    if (heroAnimating) return;
    setHeroAnimating(true);
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => prev - 1);
    setLastInteraction(Date.now());
    heroTimerRef.current = setTimeout(() => {
      setHeroAnimating(false);
      heroTimerRef.current = null;
    }, 820);
  };

  // Handle infinite loop reset
  useEffect(() => {
    if (currentImageIndex === 0) {
      // At clone of last image, jump to real last image
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentImageIndex(backgroundImages.length);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 750);
    } else if (currentImageIndex === backgroundImages.length + 1) {
      // At clone of first image, jump to real first image
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentImageIndex(1);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 750);
    }
  }, [currentImageIndex]);

  // Auto-advance carousel every 5 seconds (resets when buttons are clicked)
  useEffect(() => {
    const timer = setInterval(() => {
      if (heroAnimating) return;
      // auto-advance without changing lastInteraction
      setHeroAnimating(true);
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
      setIsTransitioning(true);
      setCurrentImageIndex((prev) => prev + 1);
      heroTimerRef.current = setTimeout(() => {
        setHeroAnimating(false);
        heroTimerRef.current = null;
      }, 820);
    }, 3000);

    return () => {
      // Only clear the interval here. Don't clear heroTimerRef here because
      // this cleanup runs whenever lastInteraction changes (eg. user clicks)
      // and would otherwise cancel the heroAnimating clear timeout prematurely.
      clearInterval(timer);
    };
  }, [lastInteraction]); // Re-create interval when lastInteraction changes

  // Clear any pending hero animation timer on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    };
  }, []);

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(80vh)" }}
    >
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${currentImageIndex * 100}%)`,
            transition: isTransitioning
              ? "transform 750ms ease-in-out"
              : "none",
          }}
        >
          {extendedImages.map((image, index) => (
            <div
              key={`bg-image-${index}-${image.path}`}
              className="w-full h-full flex-shrink-0"
              style={{ minWidth: "100%" }}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                priority={index <= 2} // High priority for first 3 images
              />
            </div>
          ))}
        </div>
      </div>

      {/* Green overlay - on top of images */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom right, rgba(20, 83, 45, 0.55), rgba(6, 78, 59, 0.55))",
        }}
      />

      {/* Counter indicator */}
      <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded">
        {((currentImageIndex - 1 + backgroundImages.length) %
          backgroundImages.length) +
          1}{" "}
        / {backgroundImages.length}
      </div>

      {/* Carousel Navigation Buttons - Inside section */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePrevious();
        }}
        type="button"
        disabled={!isTransitioning || heroAnimating}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white backdrop-blur-sm rounded-r-full p-4 md:p-6 transition-all outline-none focus:outline-none ${
          !isTransitioning || heroAnimating
            ? "opacity-50 cursor-default"
            : "hover:bg-white/30 cursor-pointer"
        }`}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-10 w-10 md:h-12 md:w-12" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNext();
        }}
        type="button"
        disabled={!isTransitioning || heroAnimating}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white backdrop-blur-sm rounded-l-full p-4 md:p-6 transition-all outline-none focus:outline-none ${
          !isTransitioning || heroAnimating
            ? "opacity-50 cursor-default"
            : "hover:bg-white/30 cursor-pointer"
        }`}
        aria-label="Next image"
      >
        <ChevronRight className="h-10 w-10 md:h-12 md:w-12" />
      </button>

      {/* Decorative Elements */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {/* Removed decorative leaf, tree, and flower elements */}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6 pointer-events-none">
        <h1 className="text-5xl md:text-7xl mb-6 drop-shadow-lg">
          Welcome to WildWood Zoo
        </h1>
        <p className="text-2xl md:text-3xl text-green-100 mb-4 drop-shadow-md">
          Where Nature Comes Alive
        </p>
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
          Experience the wonder of wildlife, discover amazing creatures, and
          create unforgettable memories with your family
        </p>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {backgroundImages.map((_, index) => {
          const displayIndex =
            (currentImageIndex - 1 + backgroundImages.length) %
            backgroundImages.length;
          return (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning || heroAnimating) return;
                setIsTransitioning(true);
                setCurrentImageIndex(index + 1); // +1 because of clone at start
                setLastInteraction(Date.now());
                // guard indicator click
                setHeroAnimating(true);
                if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
                heroTimerRef.current = setTimeout(() => {
                  setHeroAnimating(false);
                  heroTimerRef.current = null;
                }, 820);
              }}
              className={`h-2 rounded-full transition-all ${
                index === displayIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
}
