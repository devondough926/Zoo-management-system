import React, { useState, useEffect } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// Image cache to track loaded images - make it global for preloader sync
const imageCache = new Set();
if (typeof window !== "undefined") {
  window.__IMAGE_CACHE__ = imageCache;
}

export const ImageWithFallback = React.memo(function ImageWithFallback(props) {
  const [didError, setDidError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => {
    // If image is already cached, start as loaded
    return props.src ? imageCache.has(props.src) : false;
  });

  const handleError = () => {
    setDidError(true);
    setIsLoaded(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
    if (props.src) {
      imageCache.add(props.src);
    }
  };

  const {
    src,
    alt,
    style,
    className,
    width,
    height,
    priority = false,
    ...rest
  } = props;

  // Check if image was preloaded - if so, use eager loading to keep it in memory
  const wasPreloaded = src && imageCache.has(src);
  const shouldLoadEagerly = priority || wasPreloaded;

  // Force immediate preload for high priority images
  useEffect(() => {
    if (src && !imageCache.has(src) && priority) {
      const img = new Image();
      img.onload = () => imageCache.add(src);
      img.src = src;
    }
  }, [src, priority]);

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${
        className ?? ""
      }`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          width={width}
          height={height}
          {...rest}
          data-original-url={src}
        />
      </div>
    </div>
  ) : (
    <div className="relative w-full h-full" style={style}>
      {/* Skeleton loader while image loads */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${
            className ?? ""
          }`}
          style={{
            width,
            height,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
        style={{
          ...rest.style,
          // Force browser to keep decoded image in memory
          contentVisibility: wasPreloaded ? "visible" : "auto",
          // Hint to browser to keep this in GPU memory if preloaded
          transform: wasPreloaded ? "translateZ(0)" : undefined,
        }}
        width={width}
        height={height}
        loading={shouldLoadEagerly ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={priority ? "high" : "auto"}
        // Force browser to keep image decoded
        data-keep-loaded={wasPreloaded ? "true" : undefined}
        {...rest}
        onError={handleError}
        onLoad={handleLoad}
      />

      {/* CSS for shimmer animation and keeping images in memory */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        /* Force browser to keep preloaded images decoded and ready */
        img[data-keep-loaded="true"] {
          content-visibility: visible;
          image-rendering: auto;
        }
      `}</style>
    </div>
  );
});
