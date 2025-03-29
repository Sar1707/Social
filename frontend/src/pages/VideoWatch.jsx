import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Skeleton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';
import api from '../services/api';
import { getVideoUrl, getAvatarUrl } from '../utils/imageUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// Helper functions for formatting
const formatViews = (views) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
};

const formatTimeAgo = (date) => {
  if (!date) return 'Unknown time';
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

// Add VideoErrorPlaceholder component before the VideoWatch component
const VideoErrorPlaceholder = ({ message }) => {
  return (
    <Box
      sx={{
        height: '500px',
        width: '100%',
        bgcolor: 'black',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center'
      }}
    >
      <Typography variant="h6" component="div" gutterBottom>
        Video Playback Error
      </Typography>
      <Typography variant="body1" component="div" gutterBottom>
        {message || "We're having trouble playing this video."}
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => window.location.reload()}
        sx={{ mt: 2 }}
      >
        Reload Page
      </Button>
    </Box>
  );
};

function VideoWatch() {
  const { videoId } = useParams();
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null,
    owner: null,
    views: 0,
    likes: [],
    comments: [],
  });
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { token, user } = useSelector((state) => state.auth);
  const [playerErrored, setPlayerErrored] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [key, setKey] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [videoMenuAnchorEl, setVideoMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        console.log('Fetching video data for videoId:', videoId);
        
        if (!token) {
          console.warn('No authentication token available');
          setError('Please sign in to view videos');
          setLoading(false);
          return;
        }
        
        // Use our API service instead of axios directly
        const videoRes = await api.get(`/videos/${videoId}`);
        
        console.log('Video API response:', videoRes.data);
        
        if (!videoRes.data || !videoRes.data.data) {
          throw new Error('Invalid video data received');
        }
        
        const videoData = videoRes.data.data;
        console.log('Video data extracted:', videoData);
        
        // Process the videoFile URL using our utility function
        const videoUrl = getVideoUrl(videoData);
          
        if (!videoUrl) {
          console.error('Failed to extract video URL from response:', videoData);
        }
        
        const processedVideo = {
          ...videoData,
          videoFile: videoUrl || '',
          comments: [],
        };
        
        console.log('Processed video data:', processedVideo);
        setVideoData(processedVideo);
        
        // Fetch comments if available
        try {
          const commentsRes = await api.get(`/comments/${videoId}`);
          const comments = commentsRes.data?.data?.docs || commentsRes.data?.data || [];
          setVideoData((prev) => ({
            ...prev,
            comments: Array.isArray(comments) ? comments : [],
          }));
        } catch (error) {
          console.warn('Comments not available:', error);
          setVideoData((prev) => ({
            ...prev,
            comments: [],
          }));
        }
        
        // Get similar videos using API service
        const similarVideos = await api.get(`/videos`, {
          params: {
            limit: 5 // Just get a few videos
          }
        });
        
        console.log('Similar videos API response:', similarVideos.data);
        
        if (similarVideos.data && similarVideos.data.data) {
          let videosList = [];
          
          // Check if pagination is used
          if (similarVideos.data.data.docs && Array.isArray(similarVideos.data.data.docs)) {
            videosList = similarVideos.data.data.docs;
          } else if (Array.isArray(similarVideos.data.data)) {
            videosList = similarVideos.data.data;
          }
          
          // Filter out the current video and any invalid videos
          videosList = videosList
            .filter(v => v && v._id && v._id !== videoId)
            .slice(0, 5); // Limit to 5 videos
          
          // Process related videos to ensure URLs are properly formatted
          const processedRelatedVideos = videosList.map(video => ({
            ...video,
            videoFile: getVideoUrl(video) || '',
          }));
          
          setRelatedVideos(processedRelatedVideos);
        }
        
        // Check if the user is subscribed to the video owner
        if (videoData.owner && user) {
          setIsSubscribed(videoData.owner.isSubscribed || false);
        }
      } catch (error) {
        console.error('Error loading video:', error.response || error);
        setError(error.response?.data?.message || error.message || 'Error loading video');
      } finally {
        setLoading(false);
      }
    };

    if (videoId && token) {
      fetchVideoData();
    }

    // Reset states when videoId changes
    return () => {
      setPlayerErrored(false);
      setKey(0);
      document.title = 'Video Platform';
    };
  }, [videoId, token, user]);

  const handleSubscribe = async () => {
    try {
      if (!videoData.owner?._id) {
        console.error('Cannot subscribe: owner ID is missing');
        return;
      }
      
      console.log('Subscribing to channel:', videoData.owner._id);
      
      const response = await api.post(
        `/subscriptions/${videoData.owner._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      console.log('Subscription response:', response.data);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing:', error.response || error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await api.post(
        `/comments/${videoId}`,
        {
          content: commentText
        }
      );

      console.log('Comment post response:', response.data);
      
      if (response.data && response.data.data) {
        setVideoData((prev) => ({
          ...prev,
          comments: [response.data.data, ...prev.comments],
        }));
        setCommentText('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
    }
  };

  const handleLike = async () => {
    if (isLiking) return; // Prevent multiple rapid clicks
    
    try {
      setIsLiking(true);
      const response = await api.post(
        `/likes/toggle/v/${videoId}`
      );
      
      console.log('Like response:', response.data);
      
      if (response.data && response.data.data) {
        const { isLiked, like } = response.data.data;
        setVideoData((prev) => ({
          ...prev,
          likes: isLiked 
            ? [...(prev.likes || []), like]
            : (prev.likes || []).filter(l => l._id !== like._id)
        }));
      }
    } catch (error) {
      console.error('Error liking video:', error);
      setError('Failed to like video. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      const videoUrl = `${window.location.origin}/watch/${videoId}`;
      await navigator.clipboard.writeText(videoUrl);
      // You could add a toast notification here
      alert('Video link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing video:', error);
      setError('Failed to copy link. Please try again.');
    }
  };

  const handleMenuOpen = (event, comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      // If it's a temporary comment (client-side only)
      if (selectedComment._id.startsWith('temp-')) {
        setVideoData((prev) => ({
          ...prev,
          comments: prev.comments.filter(c => c._id !== selectedComment._id),
        }));
        handleMenuClose();
        return;
      }
      
      // For real comments with backend storage
      await api.delete(`/comments/c/${selectedComment._id}`);
      setVideoData((prev) => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== selectedComment._id),
      }));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  const isCommentOwner = (comment) => {
    return user && comment.owner && 
      (comment.owner._id === user._id || 
       comment._id.startsWith('temp-')); // Temp comments are always deletable
  };

  const handleVideoMenuOpen = (event) => {
    event.stopPropagation();
    setVideoMenuAnchorEl(event.currentTarget);
  };

  const handleVideoMenuClose = () => {
    setVideoMenuAnchorEl(null);
  };
  
  const openDeleteDialog = () => {
    handleVideoMenuClose();
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteVideo = async () => {
    try {
      await api.delete(`/videos/${videoId}`);
      closeDeleteDialog();
      navigate('/'); // Redirect to home page after deletion
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };
  
  const isVideoOwner = () => {
    return user && videoData?.owner && user._id === videoData.owner._id;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Box sx={{ mb: 3 }}>
          {videoData.videoFile ? (
            <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black' }}>
              <ReactPlayer
                key={key}
                url={videoData.videoFile.url || videoData.videoFile}
                width="100%"
                height="500px"
                controls
                playing
                playsinline
                onError={(e) => {
                  console.error('Video player error:', e);
                  console.log('Video URL provided:', videoData.videoFile.url || videoData.videoFile);
                  
                  // Try to reload the player once on error
                  if (!playerErrored) {
                    setPlayerErrored(true);
                    setTimeout(() => {
                      console.log('Attempting to reload player with different config...');
                      
                      // Try direct URL if object format
                      if (typeof videoData.videoFile === 'object' && videoData.videoFile.url) {
                        setVideoData(prev => ({
                          ...prev,
                          videoFile: videoData.videoFile.url
                        }));
                      }
                      
                      setKey(prevKey => prevKey + 1);
                    }, 1000);
                  }
                }}
                onReady={() => {
                  console.log('Video player ready');
                  setPlayerErrored(false);
                }}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: "anonymous",
                      controlsList: "nodownload",
                      playsInline: true
                    },
                    forceVideo: true,
                    forceHLS: false,
                  }
                }}
              />
              
              {playerErrored && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10, 
                  textAlign: 'center',
                  p: 2,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2
                }}>
                  <Typography color="white" variant="body1" gutterBottom>
                    Having trouble playing this video?
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                      // Try using the direct URL
                      if (typeof videoData.videoFile === 'object' && videoData.videoFile.url) {
                        setVideoData(prev => ({
                          ...prev,
                          videoFile: videoData.videoFile.url
                        }));
                      }
                      setKey(prevKey => prevKey + 1);
                    }}
                    sx={{ m: 1 }}
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => window.location.reload()}
                    sx={{ m: 1 }}
                  >
                    Reload Page
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <VideoErrorPlaceholder message="Video URL not available" />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {videoData.title}
          </Typography>
          
          {isVideoOwner() && (
            <>
              <IconButton onClick={handleVideoMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              
              <Menu
                anchorEl={videoMenuAnchorEl}
                open={Boolean(videoMenuAnchorEl)}
                onClose={handleVideoMenuClose}
              >
                <MenuItem onClick={openDeleteDialog}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete Video
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={getAvatarUrl(videoData.owner?.avatar)}
            alt={videoData.owner?.username || 'User'}
            sx={{ width: 50, height: 50, mr: 2 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">
              {videoData.owner?.fullName || videoData.owner?.username || 'Unknown User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {videoData.views || 0} views • {new Date(videoData.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Button
            variant={isSubscribed ? 'outlined' : 'contained'}
            startIcon={<PersonAddIcon />}
            onClick={handleSubscribe}
            disabled={!token}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1" paragraph>
            {videoData.description || 'No description available'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={handleLike} 
              disabled={!token || isLiking}
              color={videoData.likes?.some(like => like?.owner?._id === user?._id) ? 'primary' : 'inherit'}
            >
              <ThumbUpIcon />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {(videoData.likes || []).length}
              </Typography>
            </IconButton>
            <IconButton>
              <ThumbDownIcon />
            </IconButton>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <IconButton sx={{ ml: 'auto' }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Comments ({videoData.comments?.length || 0})
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Comments functionality is currently in development. Your comments will be stored locally but not saved to the server.
        </Alert>

        {token ? (
          <Box component="form" onSubmit={handleComment} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!commentText.trim() || !token}
            >
              Comment
            </Button>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Please sign in to comment
          </Alert>
        )}

        {videoData.comments && videoData.comments.length > 0 ? (
          videoData.comments.map((comment) => (
            <Box key={comment._id} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar
                  src={comment.owner?.avatar?.url || ''}
                  alt={comment.owner?.username || 'User'}
                  sx={{ mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    {comment.owner?.fullName || comment.owner?.username || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimeAgo(comment.createdAt)}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {comment.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <IconButton size="small" disabled={!token}>
                      <ThumbUpIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {comment.likesCount || 0}
                      </Typography>
                    </IconButton>
                    <IconButton size="small" disabled={!token}>
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                    
                    {isCommentOwner(comment) && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMenuOpen(e, comment)}
                        aria-label="comment options"
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
            </Box>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No comments yet. Be the first to comment!
          </Typography>
        )}
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom>
          Related Videos
        </Typography>
        {loading ? (
          // Show skeletons while loading
          Array(4).fill().map((_, index) => (
            <Box key={`skeleton-${index}`} sx={{ display: 'flex', mb: 2 }}>
              <Skeleton variant="rectangular" width={120} height={70} />
              <Box sx={{ ml: 1, flex: 1 }}>
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))
        ) : relatedVideos?.length > 0 ? (
          relatedVideos.map((relatedVideo) => (
            <Box 
              key={relatedVideo._id} 
              sx={{ 
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                } 
              }}
              onClick={() => {
                // Navigate to the video page and reset state
                setLoading(true);
                window.location.href = `/watch/${relatedVideo._id}`;
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ width: '40%', position: 'relative' }}>
                  <img
                    src={
                      relatedVideo.thumbnail?.url || 
                      relatedVideo.thumbnail || 
                      '/images/thumbnail-placeholder.svg'
                    }
                    alt={relatedVideo.title || 'Video'}
                    style={{ 
                      width: '100%', 
                      borderRadius: 8, 
                      height: '70px', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      console.error(`Error loading thumbnail for related video ${relatedVideo._id}`);
                      e.target.src = '/images/thumbnail-placeholder.svg';
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {relatedVideo.title || 'Untitled Video'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {relatedVideo.owner?.fullName || relatedVideo.ownerDetails?.fullName || 'Unknown User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatViews(relatedVideo.views || 0)} • {formatTimeAgo(relatedVideo.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">
            No related videos found
          </Typography>
        )}
      </Grid>

      {/* Comment Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteComment}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Comment
        </MenuItem>
      </Menu>

      {/* Delete Video Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Video</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this video? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteVideo} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default VideoWatch; 