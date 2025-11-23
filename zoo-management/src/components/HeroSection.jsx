import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { preloadImages } from "../utils/imagePreloader";
import { useWeather } from "../contexts/WeatherContext";
import { Link } from "react-router-dom";

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
  const { selectedWeather } = useWeather();
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

  // Auto-advance carousel (resets when buttons are clicked)
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
      }, 1200);
    }, 3500);

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
      {/* Weather Alert */}
      {selectedWeather && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: "#fee2e2",
            borderBottom: "2px solid #fecaca",
            padding: "12px 20px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{
              color: "#1f2937",
              fontSize: 14,
              margin: 0,
              fontWeight: 600,
            }}
          >
            <strong style={{ color: "#111827" }}>
              Weather Impact Information:
            </strong>{" "}
            {getWeatherImpactText(selectedWeather.type)}
          </p>
        </div>
      )}
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

      {/* Pagination dots (single, consolidated) - inline styles for visibility */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 24,
          // Lower z-index so pagination sits beneath the site navigation
          zIndex: 5,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
            borderRadius: 9999,
            padding: "6px 12px",
          }}
        >
          {backgroundImages.map((_, index) => {
            const displayIndex =
              (currentImageIndex - 1 + backgroundImages.length) %
              backgroundImages.length;
            const isActive = index === displayIndex;
            const disabled = !isTransitioning || heroAnimating;
            return (
              <button
                key={index}
                onClick={() => {
                  if (disabled) return;
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
                disabled={disabled}
                aria-label={`Go to slide ${index + 1}`}
                style={{
                  height: 8,
                  width: isActive ? 32 : 8,
                  borderRadius: 9999,
                  transition: "all 200ms ease",
                  backgroundColor: isActive
                    ? "#ffffff"
                    : "rgba(255,255,255,0.5)",
                  border: "none",
                  padding: 0,
                  cursor: disabled ? "default" : "pointer",
                }}
              />
            );
          })}
        </div>
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

      {/* Decorative Elements (placeholders removed) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Decorative elements intentionally omitted */}
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

      {/* (Old carousel indicators removed — replaced by consolidated pagination above) */}
    </section>
  );
}

function getWeatherImpactText(weatherType) {
  switch (weatherType) {
    case "Rain":
    case "Storm":
    case "High Wind":
      return (
        <>
          Outdoor and Hybrid{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed for visitor safety.
        </>
      );
    case "Snow":
      return (
        <>
          Outdoor{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed for visitor safety.
        </>
      );
    case "Extreme Heat":
    case "Extreme Cold":
      return (
        <>
          All{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed due to extreme weather conditions.
        </>
      );
    default:
      return (
        <>
          Some{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          may be affected by current weather conditions.
        </>
      );
  }
}
