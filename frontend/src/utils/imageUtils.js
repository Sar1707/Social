/**
 * Helper function to process image URLs for proper display
 * This handles both Cloudinary URLs and local file paths
 */
export const getValidImageUrl = (imageData) => {
  if (!imageData) return null;
  
  // If it's a string URL
  if (typeof imageData === 'string') {
    if (imageData.startsWith('http')) {
      return imageData;
    } else if (imageData.startsWith('/temp/')) {
      return `${window.location.origin}${imageData}`;
    }
  }
  
  // If it's an object with url property
  if (imageData && typeof imageData === 'object' && imageData.url) {
    if (typeof imageData.url === 'string') {
      if (imageData.url.startsWith('http')) {
        return imageData.url;
      } else if (imageData.url.startsWith('/temp/')) {
        return `${window.location.origin}${imageData.url}`;
      }
    }
  }
  
  // Default fallback
  return null;
};

/**
 * Helper function specifically for avatar images
 * Provides a default avatar if none is available
 */
export const getAvatarUrl = (avatar) => {
  const url = getValidImageUrl(avatar);
  // Return the processed URL or a default avatar
  return url || '/default-avatar.png';
};

/**
 * Helper function for video URLs 
 * Completely rewritten for better reliability with Cloudinary and local files
 */
export const getVideoUrl = (video) => {
  if (!video) return null;
  
  // Case 1: If videoFile is already a string URL
  if (typeof video.videoFile === 'string' && video.videoFile.trim() !== '') {
    return video.videoFile;
  }
  
  // Case 2: If videoFile is an object with url property (new schema)
  if (video.videoFile && typeof video.videoFile === 'object' && video.videoFile.url) {
    return video.videoFile.url;
  }
  
  // Case 3: If video itself has url property
  if (video.url) {
    return video.url;
  }
  
  // Default fallback: No valid URL found
  return null;
};

/**
 * Helper to optimize Cloudinary URLs for better video playback
 */
function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  try {
    console.log('Optimizing Cloudinary URL:', url);
    
    // Skip if already optimized
    if (url.includes('/video/upload/q_auto')) {
      return url;
    }
    
    // Standard structure for Cloudinary URLs is:
    // https://res.cloudinary.com/{cloud_name}/video/upload/{transformations}/{public_id}.{format}
    const uploadIndex = url.indexOf('/upload/');
    
    if (uploadIndex !== -1) {
      const baseUrl = url.substring(0, uploadIndex + 8); // Include '/upload/'
      const resourcePath = url.substring(uploadIndex + 8);
      
      // Apply optimizations: auto quality, auto format, streaming profile
      const optimizedUrl = `${baseUrl}q_auto,f_auto,sp_full_hd/${resourcePath}`;
      console.log('Optimized URL:', optimizedUrl);
      return optimizedUrl;
    }
    
    // If we can't parse it properly, return the original
    return url;
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url;
  }
}; 