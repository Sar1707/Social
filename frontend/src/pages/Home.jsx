import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  IconButton,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feed-tabpanel-${index}`}
      aria-labelledby={`feed-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isHistoryPage = location.pathname === '/history';
  
  useEffect(() => {
    if (isHistoryPage) {
      document.title = 'History - SOCIAL';
    } else {
      document.title = 'Home - SOCIAL';
    }
  }, [isHistoryPage]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching ${isHistoryPage ? 'history' : 'home'} content with token:`, token);
        
        if (isHistoryPage) {
          // Fetch history content
          const [historyVideosRes, historyTweetsRes] = await Promise.all([
            axios.get(`${API_URL}/users/watch-history`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }),
            axios.get(`${API_URL}/tweets`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }),
          ]);
          
          console.log('History videos response:', historyVideosRes.data);
          console.log('History tweets response:', historyTweetsRes.data);
          
          if (historyVideosRes.data?.success && historyVideosRes.data?.data && Array.isArray(historyVideosRes.data.data)) {
            const processedVideos = historyVideosRes.data.data.map(processVideoData);
            setVideos(processedVideos);
          } else if (historyVideosRes.data?.data && !Array.isArray(historyVideosRes.data.data)) {
            console.error('History video data is not an array:', historyVideosRes.data);
            setVideos([]);
          } else {
            console.error('History video data format unexpected:', historyVideosRes.data);
            setVideos([]);
          }
          
          if (historyTweetsRes.data?.success && historyTweetsRes.data?.data && Array.isArray(historyTweetsRes.data.data)) {
            setTweets(historyTweetsRes.data.data);
          } else if (historyTweetsRes.data?.data && !Array.isArray(historyTweetsRes.data.data)) {
            console.error('History tweet data is not an array:', historyTweetsRes.data);
            setTweets([]);
          } else {
            console.error('History tweet data format unexpected:', historyTweetsRes.data);
            setTweets([]);
          }
        } else {
          // Fetch home content
          const [videosRes, tweetsRes] = await Promise.all([
            axios.get(`${API_URL}/videos`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }),
            axios.get(`${API_URL}/tweets`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }),
          ]);

          console.log('Videos response:', videosRes.data);
          console.log('Tweets response:', tweetsRes.data);

          if (videosRes.data?.success && videosRes.data?.data) {
            // Check if it's a pagination object from the backend
            if (videosRes.data.data.docs && Array.isArray(videosRes.data.data.docs)) {
              const processedVideos = videosRes.data.data.docs.map(processVideoData);
              setVideos(processedVideos);
              console.log('Processed videos:', processedVideos);
            } else if (Array.isArray(videosRes.data.data)) {
              const processedVideos = videosRes.data.data.map(processVideoData);
              setVideos(processedVideos);
              console.log('Processed videos:', processedVideos);
            } else {
              console.error('Video data is not an array:', videosRes.data);
              setVideos([]);
            }
          } else {
            console.error('Video data format unexpected:', videosRes.data);
            setVideos([]);
          }
          
          if (tweetsRes.data?.success && tweetsRes.data?.data && Array.isArray(tweetsRes.data.data)) {
            setTweets(tweetsRes.data.data);
          } else if (tweetsRes.data?.data && !Array.isArray(tweetsRes.data.data)) {
            console.error('Tweet data is not an array:', tweetsRes.data);
            setTweets([]);
          } else {
            console.error('Tweet data format unexpected:', tweetsRes.data);
            setTweets([]);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${isHistoryPage ? 'history' : 'home'} content:`, error.response || error);
        setError(`Failed to load ${isHistoryPage ? 'history' : ''} content. Please try again.`);
        setVideos([]);
        setTweets([]);
      } finally {
        setLoading(false);
      }
    };

    const processVideoData = (video) => {
      // Ensure video object has the necessary properties
      console.log('Processing video data:', video);
      return {
        ...video,
        thumbnail: video.thumbnail?.url || video.thumbnail || 'https://placehold.co/600x400?text=Video',
        videoFile: video.videoFile?.url || video.videoFile || '',
      };
    };

    if (token) {
      fetchContent();
    } else {
      setLoading(false);
      setError('Please sign in to view content');
    }
  }, [token, isHistoryPage, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatTimeAgo = (date) => {
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

  const renderVideoSkeleton = () => (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card sx={{ height: '100%' }}>
        <Skeleton variant="rectangular" height={180} />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderVideos = () => {
    // Handle loading state first
    if (loading) {
      return (
        <Grid container spacing={2}>
          {Array(8).fill().map((_, index) => renderVideoSkeleton(index))}
        </Grid>
      );
    }
    
    // Ensure videos is an array before mapping
    if (!Array.isArray(videos)) {
      console.error('Videos is not an array:', videos);
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading videos. Please refresh the page.
        </Alert>
      );
    }
    
    if (videos.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {isHistoryPage 
              ? "You haven't watched any videos yet" 
              : "No videos available"}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {videos.map((video) => {
          if (!video || !video._id) {
            console.error('Invalid video object:', video);
            return null;
          }
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
              <VideoCard 
                video={video} 
                formatTimeAgo={formatTimeAgo} 
                formatViews={formatViews} 
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderTweets = () => {
    // Ensure tweets is an array before mapping
    if (!Array.isArray(tweets)) {
      console.error('Tweets is not an array:', tweets);
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading tweets. Please refresh the page.
        </Alert>
      );
    }
    
    if (tweets.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {isHistoryPage 
              ? "You haven't viewed any tweets yet" 
              : "No tweets available"}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {tweets.map((tweet) => {
          if (!tweet || !tweet._id) {
            console.error('Invalid tweet object:', tweet);
            return null;
          }
          
          return (
            <Grid item xs={12} key={tweet._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      src={tweet.owner?.avatar?.url || tweet.ownerDetails?.avatar?.url || ''}
                      alt={tweet.owner?.username || tweet.ownerDetails?.username || 'User'}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        {tweet.owner?.fullName || tweet.ownerDetails?.fullName || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimeAgo(tweet.createdAt)}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {tweet.content || 'No content'}
                      </Typography>
                      {tweet.image && (
                        <CardMedia
                          component="img"
                          image={tweet.image?.url || tweet.image}
                          alt="Tweet image"
                          sx={{ mt: 2, borderRadius: 1, maxHeight: 400 }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
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

  return (
    <Box>
      {isHistoryPage && (
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Your History
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="Videos" />
        <Tab label="Tweets" />
      </Tabs>

      {Array.isArray(videos) && videos.length === 0 && Array.isArray(tweets) && tweets.length === 0 && !loading && !error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {isHistoryPage 
              ? "You haven't watched any videos or viewed any tweets yet" 
              : "No content available"}
          </Typography>
        </Box>
      ) : (
        tabValue === 0 ? renderVideos() : renderTweets()
      )}
    </Box>
  );
}

export default Home; 