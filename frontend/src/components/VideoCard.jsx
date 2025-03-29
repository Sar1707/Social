import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Avatar,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { getVideoUrl } from '../utils/videoUtils';

const VideoCard = ({ video, formatTimeAgo, formatViews }) => {
  const navigate = useNavigate();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  // Use a ref to track if we've already handled an error for this thumbnail
  const errorHandledRef = useRef(false);
  
  useEffect(() => {
    // Debug the video object structure on component mount
    if (video) {
      console.log(`Video object (ID: ${video._id || 'unknown'}) structure:`, 
        JSON.stringify({
          videoFileType: typeof video.videoFile,
          videoFile: video.videoFile,
          thumbnailType: typeof video.thumbnail,
          thumbnail: video.thumbnail
        }, null, 2));
    }
    
    // Reset error handling state when video changes
    errorHandledRef.current = false;
    setThumbnailError(false);
    setThumbnailLoading(true);
  }, [video]);
  
  if (!video || !video._id) {
    console.error('Invalid video object:', video);
    return null;
  }
  
  const { 
    _id, 
    title, 
    thumbnail, 
    views, 
    createdAt, 
    owner,
    videoFile
  } = video;
  
  const handleCardClick = () => {
    navigate(`/watch/${_id}`);
  };
  
  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail || thumbnailError) return '/images/thumbnail-placeholder.svg';
    
    // If it's a string URL, use it directly
    if (typeof thumbnail === 'string') {
      return thumbnail;
    }
    
    // If it's an object, try to find a URL property
    if (typeof thumbnail === 'object') {
      if (thumbnail.url) return thumbnail.url;
      if (thumbnail.secure_url) return thumbnail.secure_url;
      if (thumbnail.src) return thumbnail.src;
      
      // Look for any string property that could be a URL
      for (const key in thumbnail) {
        if (typeof thumbnail[key] === 'string' && 
            (thumbnail[key].startsWith('http') || 
             thumbnail[key].includes('cloudinary'))) {
          return thumbnail[key];
        }
      }
    }
    
    return '/images/thumbnail-placeholder.svg';
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };
  
  const handleThumbnailError = (e) => {
    // Prevent multiple error handlings for the same thumbnail
    if (errorHandledRef.current) return;
    
    console.error('Error loading thumbnail:', _id);
    errorHandledRef.current = true;
    setThumbnailError(true);
    setThumbnailLoading(false);
    
    // Use the thumbnail placeholder, not avatar placeholder
    // Don't set src dynamically to avoid potential infinite loops
  };
  
  // Format the video URLs - safely handle any potential undefined values
  let videoUrl = null;
  try {
    videoUrl = getVideoUrl(videoFile);
    console.log('Video URL processed:', videoUrl);
  } catch (error) {
    console.error('Error processing video URL:', error);
    videoUrl = null;
  }
  
  // Get the thumbnail URL - use placeholder directly if there's an error
  const thumbnailUrl = thumbnailError 
    ? '/images/thumbnail-placeholder.svg' 
    : getThumbnailUrl(thumbnail);
  
  // Handle user/avatar - the user could be populated or not
  const username = owner?.username || 'Unknown user';
  let avatarUrl = null;
  
  if (owner?.avatar) {
    avatarUrl = typeof owner.avatar === 'string' ? owner.avatar : 
               (owner.avatar.url || owner.avatar.secure_url || '/images/avatar-placeholder.svg');
  }
  
  // Format date
  const formattedDate = createdAt 
    ? formatDistance(new Date(createdAt), new Date(), { addSuffix: true })
    : '';
  
  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative' }}>
        {thumbnailLoading && !thumbnailError && (
          <Skeleton 
            variant="rectangular" 
            animation="wave"
            width="100%" 
            height={180} 
            sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
          />
        )}
        <CardMedia
          component="img"
          height="180"
          image={thumbnailUrl}
          alt={title || 'Video'}
          sx={{ 
            objectFit: 'cover',
            visibility: thumbnailLoading && !thumbnailError ? 'hidden' : 'visible'
          }}
          onLoad={handleThumbnailLoad}
          onError={handleThumbnailError}
        />
      </Box>
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            src={avatarUrl || '/images/avatar-placeholder.svg'}
            alt={username}
            sx={{ width: 40, height: 40 }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title || 'Untitled Video'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatViews ? formatViews(views || 0) : `${views || 0} views`} • {formattedDate}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoCard; 