/**
 * Processes a video URL to ensure correct formatting for playback
 * This handles various Cloudinary formats and ensures the URL is properly formatted
 */
export const getVideoUrl = (url) => {
  if (!url) return null;

  console.log('Processing video URL:', url);
  
  // Handle non-string URL values
  if (typeof url !== 'string') {
    console.warn('getVideoUrl received non-string value:', url);
    // Log the object structure to debug
    console.log('URL object structure:', JSON.stringify(url, null, 2));
    
    // Try different common properties for URL objects
    if (url && typeof url === 'object') {
      // Check for common property names that might contain the URL
      if (url.url && typeof url.url === 'string') {
        url = url.url;
      } else if (url.secure_url && typeof url.secure_url === 'string') {
        url = url.secure_url;
      } else if (url.path && typeof url.path === 'string') {
        url = url.path;
      } else if (url.src && typeof url.src === 'string') {
        url = url.src;
      } else {
        // Look for any string property that could be a URL
        for (const key in url) {
          if (typeof url[key] === 'string' && 
              (url[key].startsWith('http') || url[key].includes('cloudinary'))) {
            console.log('Found potential URL in property:', key);
            url = url[key];
            break;
          }
        }
      }
    }
    
    // If we still don't have a string URL, return null
    if (typeof url !== 'string') {
      console.error('Could not extract string URL from object');
      return null;
    }
  }
  
  // If already a complete URL with http/https, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // For Cloudinary URLs, ensure they have the correct format
    if (url.includes('cloudinary.com')) {
      try {
        // Parse the Cloudinary URL to ensure proper format
        const urlObj = new URL(url);
        
        // For video URLs that need streaming format
        if (url.includes('/video/upload/') && !url.includes('/streaming/')) {
          // Add streaming parameter if missing
          const pathParts = urlObj.pathname.split('/');
          const uploadIndex = pathParts.indexOf('upload');
          
          if (uploadIndex !== -1 && !pathParts.includes('streaming')) {
            pathParts.splice(uploadIndex + 1, 0, 'streaming');
            urlObj.pathname = pathParts.join('/');
            console.log('Added streaming to Cloudinary URL:', urlObj.toString());
            return urlObj.toString();
          }
        }
        
        // Make sure URL ends with proper extension if it's a direct video file
        if (url.includes('/video/upload/') && 
            !url.endsWith('.mp4') && 
            !url.endsWith('.webm') && 
            !url.endsWith('.m3u8')) {
          // Try to use m3u8 for HLS streaming by default
          return url + '.m3u8';
        }
      } catch (e) {
        console.error('Error parsing Cloudinary URL:', e);
      }
    }
    
    return url;
  }
  
  // Handle relative URLs or partial paths
  if (url.startsWith('/')) {
    // Assume it's a local path relative to the server
    return `${process.env.REACT_APP_API_URL || ''}${url}`;
  }
  
  // For Cloudinary resource IDs without full URL
  if (url.includes('video/upload') || !url.includes('/')) {
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
    return `https://res.cloudinary.com/${cloudName}/video/upload/streaming/${url}`;
  }
  
  console.warn('Unrecognized video URL format:', url);
  return url;
};

// Function to retrieve a fallback URL if primary fails
export const getFallbackVideoUrl = (primaryUrl) => {
  if (!primaryUrl) return null;
  
  // If it's a streaming URL, try direct MP4
  if (primaryUrl.includes('/streaming/')) {
    return primaryUrl.replace('/streaming/', '/');
  }
  
  // If it's HLS format, try MP4
  if (primaryUrl.endsWith('.m3u8')) {
    return primaryUrl.replace('.m3u8', '.mp4');
  }
  
  // If it's already MP4, try webm
  if (primaryUrl.endsWith('.mp4')) {
    return primaryUrl.replace('.mp4', '.webm');
  }
  
  // Default fallback - just add mp4 extension
  return primaryUrl + '.mp4';
}; 