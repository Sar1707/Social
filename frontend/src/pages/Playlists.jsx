import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function Playlists() {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchPlaylists();
  }, [token]);

  const fetchPlaylists = async () => {
    try {
      console.log('Fetching playlists from API...');
      const response = await axios.get(`${API_URL}/playlist`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      console.log('Playlists API response:', response.data);
      
      if (response.data && response.data.data) {
        setPlaylists(response.data.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error.response || error);
      setError(error.response?.data?.message || 'Error loading playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      console.log('Creating new playlist:', { name: playlistName, description });
      const response = await axios.post(
        `${API_URL}/playlist`,
        {
          name: playlistName,
          description: description,
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Create playlist response:', response.data);
      
      if (response.data && response.data.data) {
        setPlaylists([...playlists, response.data.data]);
        handleCloseDialog();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating playlist:', error.response || error);
      setError(error.response?.data?.message || 'Error creating playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      console.log('Deleting playlist:', playlistId);
      await axios.delete(`${API_URL}/playlist/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      console.log('Playlist deleted successfully');
      setPlaylists(playlists.filter((playlist) => playlist._id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error.response || error);
      setError(error.response?.data?.message || 'Error deleting playlist');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPlaylistName('');
    setDescription('');
    setError(null);
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Your Playlists</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Playlist
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {playlists.map((playlist) => (
          <Grid item xs={12} sm={6} md={4} key={playlist._id}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {playlist.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, flex: 1 }}
              >
                {playlist.description || 'No description'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {playlist.videos?.length || 0} videos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => navigate(`/playlists/${playlist._id}`)}
                  fullWidth
                >
                  Play
                </Button>
                <IconButton
                  onClick={() => navigate(`/playlists/${playlist._id}/edit`)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeletePlaylist(playlist._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            fullWidth
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreatePlaylist} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Playlists; 