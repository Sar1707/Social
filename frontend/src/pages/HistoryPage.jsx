import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Grid, Alert, Button } from '@mui/material';
import VideoCard from '../components/VideoCard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getVideoUrl } from '../utils/videoUtils';

const HistoryPage = () => {
  const [historyVideos, setHistoryVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/history`, {
          withCredentials: true,
        });
        
        if (response.data && Array.isArray(response.data.history)) {
          // Process the video URLs to ensure proper formatting
          const processedVideos = response.data.history
            .filter(item => item.video) // Filter out any null/undefined videos
            .map(item => ({
              ...item.video,
              videoFile: getVideoUrl(item.video.videoFile),
              watchedAt: item.watchedAt
            }));
          
          setHistoryVideos(processedVideos);
          console.log('History loaded:', processedVideos.length);
        } else {
          console.error('Invalid history response format:', response.data);
          setError('Failed to load watch history. Invalid response format.');
        }
      } catch (err) {
        console.error('Error fetching watch history:', err);
        if (err.response && err.response.status === 401) {
          setError('Please log in to view your watch history');
        } else {
          setError(err.message || 'Failed to load watch history');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  const handleClearHistory = async () => {
    try {
      if (window.confirm('Are you sure you want to clear your entire watch history?')) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/history`, {
          withCredentials: true,
        });
        setHistoryVideos([]);
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear watch history');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Watch History
          </Typography>
          
          {historyVideos.length > 0 && (
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleClearHistory}
            >
              Clear History
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : historyVideos.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your watch history is empty.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {historyVideos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
                <VideoCard 
                  video={video} 
                  onClick={() => handleVideoClick(video._id)} 
                  additionalInfo={
                    video.watchedAt ? 
                    `Watched on ${new Date(video.watchedAt).toLocaleDateString()}` : 
                    undefined
                  }
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default HistoryPage; 