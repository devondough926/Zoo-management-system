import sharp from "sharp";

/**
 * Image optimization configuration
 */
const OPTIMIZATION_CONFIG = {
  // Maximum dimensions for different image types
  maxWidth: {
    animal: 800, // Animal images
    exhibit: 1200, // Exhibit images
    thumbnail: 300, // Thumbnails
  },

  // WebP quality settings
  webp: {
    quality: 85, // Good balance between quality and size
    effort: 4, // Compression effort (0-6, higher = better compression but slower)
    lossless: false, // Use lossy compression for smaller files
    nearLossless: false,
    smartSubsample: true, // Better color handling
    alphaQuality: 100, // Preserve transparency quality
  },

  // JPEG quality (fallback for browsers without WebP support)
  jpeg: {
    quality: 85,
    progressive: true, // Progressive JPEGs load faster
  },

  // PNG optimization
  png: {
    quality: 85,
    compressionLevel: 8,
  },
};

/**
 * Optimize image buffer
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<{webp: Buffer, original: Buffer, metadata: Object}>}
 */
export async function optimizeImage(buffer, options = {}) {
  const { maxWidth = 1200, format = "webp", quality = 85 } = options;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Create Sharp instance
    let image = sharp(buffer);

    // Resize if needed (maintain aspect ratio)
    if (metadata.width > maxWidth) {
      image = image.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Optimize based on format
    let optimizedBuffer;

    if (format === "webp") {
      optimizedBuffer = await image
        .webp({
          quality: OPTIMIZATION_CONFIG.webp.quality,
          effort: OPTIMIZATION_CONFIG.webp.effort,
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
          alphaQuality: 100,
        })
        .toBuffer();
    } else if (format === "jpeg" || format === "jpg") {
      optimizedBuffer = await image
        .jpeg({
          quality: OPTIMIZATION_CONFIG.jpeg.quality,
          progressive: OPTIMIZATION_CONFIG.jpeg.progressive,
        })
        .toBuffer();
    } else if (format === "png") {
      optimizedBuffer = await image
        .png({
          quality: OPTIMIZATION_CONFIG.png.quality,
          compressionLevel: OPTIMIZATION_CONFIG.png.compressionLevel,
        })
        .toBuffer();
    } else {
      // Default to WebP for unknown formats
      optimizedBuffer = await image
        .webp({
          quality: OPTIMIZATION_CONFIG.webp.quality,
          effort: OPTIMIZATION_CONFIG.webp.effort,
        })
        .toBuffer();
    }

    const compressionRatio = (
      (1 - optimizedBuffer.length / buffer.length) *
      100
    ).toFixed(2);

    return {
      buffer: optimizedBuffer,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: parseFloat(compressionRatio),
      width: metadata.width > maxWidth ? maxWidth : metadata.width,
      height: metadata.height,
      format: format,
    };
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw new Error(`Image optimization failed: ${error.message}`);
  }
}

/**
 * Generate thumbnail from image buffer
 * @param {Buffer} buffer - Original image buffer
 * @param {number} size - Thumbnail size (width)
 * @returns {Promise<Buffer>}
 */
export async function generateThumbnail(buffer, size = 300) {
  try {
    const thumbnail = await sharp(buffer)
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 80,
        effort: 4,
      })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}

/**
 * Create multiple image variants (original, optimized, thumbnail)
 * @param {Buffer} buffer - Original image buffer
 * @param {string} imageType - Type of image (animal, exhibit)
 * @returns {Promise<Object>}
 */
export async function createImageVariants(buffer, imageType = "animal") {
  try {
    const maxWidth = OPTIMIZATION_CONFIG.maxWidth[imageType] || 1200;

    // Optimize main image as WebP
    const optimized = await optimizeImage(buffer, {
      maxWidth,
      format: "webp",
    });

    // Create thumbnail
    const thumbnail = await generateThumbnail(
      buffer,
      OPTIMIZATION_CONFIG.maxWidth.thumbnail
    );

    return {
      main: {
        buffer: optimized.buffer,
        size: optimized.optimizedSize,
        format: "webp",
        width: optimized.width,
      },
      thumbnail: {
        buffer: thumbnail,
        size: thumbnail.length,
        format: "webp",
        width: OPTIMIZATION_CONFIG.maxWidth.thumbnail,
      },
      metadata: {
        originalSize: buffer.length,
        compressionRatio: optimized.compressionRatio,
      },
    };
  } catch (error) {
    console.error("Error creating image variants:", error);
    throw new Error(`Failed to create image variants: ${error.message}`);
  }
}

/**
 * Validate and process uploaded image
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<boolean>}
 */
export async function validateImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    // Check if valid image
    if (!metadata.format) {
      throw new Error("Invalid image format");
    }

    // Check dimensions (max 8000x8000)
    if (metadata.width > 8000 || metadata.height > 8000) {
      throw new Error("Image dimensions too large (max 8000x8000)");
    }

    return true;
  } catch (error) {
    console.error("Image validation failed:", error);
    return false;
  }
}

export default {
  optimizeImage,
  generateThumbnail,
  createImageVariants,
  validateImage,
  OPTIMIZATION_CONFIG,
};
