import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Grid, Alert } from '@mui/material';
import VideoCard from '../components/VideoCard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getVideoUrl } from '../utils/videoUtils';

const TrendingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/videos/trending`);
        
        if (response.data && Array.isArray(response.data.videos)) {
          // Process video URLs to ensure proper format
          const processedVideos = response.data.videos.map(video => ({
            ...video,
            videoFile: getVideoUrl(video.videoFile)
          }));
          
          setVideos(processedVideos);
          console.log('Trending videos loaded:', processedVideos.length);
        } else {
          console.error('Invalid trending videos response format:', response.data);
          setError('Failed to load trending videos. Invalid response format.');
        }
      } catch (err) {
        console.error('Error fetching trending videos:', err);
        setError(err.message || 'Failed to load trending videos');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingVideos();
  }, []);

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Trending Videos
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : videos.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No trending videos found.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <VideoCard video={video} onClick={() => handleVideoClick(video._id)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default TrendingPage; 