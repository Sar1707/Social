import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function PlaylistView() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [playlist, setPlaylist] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId, token]);

  const fetchPlaylist = async () => {
    try {
      const response = await axios.get(`${API_URL}/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const playlistData = response.data.data;
      setPlaylist(playlistData);
      if (playlistData.videos && playlistData.videos.length > 0) {
        setCurrentVideo(playlistData.videos[0]);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error loading playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to remove this video from the playlist?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/playlists/${playlistId}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update the playlist in state
      setPlaylist(prev => ({
        ...prev,
        videos: prev.videos.filter(video => video._id !== videoId)
      }));

      // If the current video was removed, play the next one
      if (currentVideo._id === videoId) {
        const nextVideo = playlist.videos.find(video => video._id !== videoId);
        setCurrentVideo(nextVideo || null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error removing video');
    }
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

  if (!playlist) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Playlist not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/playlists')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">{playlist.name}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {currentVideo ? (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Paper sx={{ position: 'relative', paddingTop: '56.25%' }}>
                <ReactPlayer
                  url={currentVideo.videoFile}
                  width="100%"
                  height="100%"
                  controls
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </Paper>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">{currentVideo.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentVideo.description}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No videos in playlist
              </Typography>
            </Paper>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Playlist Videos
            </Typography>
            <List>
              {playlist.videos && playlist.videos.map((video, index) => (
                <ListItem
                  key={video._id}
                  button
                  selected={currentVideo?._id === video._id}
                  onClick={() => setCurrentVideo(video)}
                >
                  <ListItemText
                    primary={video.title}
                    secondary={`${index + 1} • ${video.duration || 'Unknown duration'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRemoveVideo(video._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PlaylistView; 