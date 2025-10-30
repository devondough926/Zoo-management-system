import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  // Create extended array with clones for infinite effect
  const extendedImages = [
    backgroundImages[backgroundImages.length - 1], // Clone of last image
    ...backgroundImages,
    backgroundImages[0], // Clone of first image
  ];

  const handleNext = () => {
    console.log(
      "Next button clicked, current index:",
      currentImageIndex,
      "transitioning:",
      isTransitioning
    );
    if (!isTransitioning) return;

    setIsTransitioning(true);
    setCurrentImageIndex((prev) => prev + 1);
    setLastInteraction(Date.now());
  };

  const handlePrevious = () => {
    console.log(
      "Previous button clicked, current index:",
      currentImageIndex,
      "transitioning:",
      isTransitioning
    );
    if (!isTransitioning) return;

    setIsTransitioning(true);
    setCurrentImageIndex((prev) => prev - 1);
    setLastInteraction(Date.now());
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

  console.log("HeroSection render - currentImageIndex:", currentImageIndex);
  console.log("Total images loaded:", backgroundImages.length);
  console.log(
    "Image paths:",
    backgroundImages.map((img, i) => `${i}: ${img.path}`)
  );

  // Auto-advance carousel every 5 seconds (resets when buttons are clicked)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [lastInteraction]); // Re-create interval when lastInteraction changes

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
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                onLoad={() =>
                  console.log(`✓ Image ${index} loaded successfully`)
                }
                onError={(e) =>
                  console.error(`✗ Image ${index} failed to load:`, e)
                }
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
        disabled={!isTransitioning}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-r-full p-4 md:p-6 transition-all disabled:opacity-50  cursor-pointer disabled:cursor-default outline-none focus:outline-none"
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
        disabled={!isTransitioning}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-l-full p-4 md:p-6 transition-all disabled:opacity-50  cursor-pointer disabled:cursor-default outline-none focus:outline-none"
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
                setIsTransitioning(true);
                setCurrentImageIndex(index + 1); // +1 because of clone at start
                setLastInteraction(Date.now());
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
