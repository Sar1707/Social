import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

function TweetCreate() {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Tweet content cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      console.log('Sending tweet with content:', content);
      console.log('Including image:', image ? 'Yes' : 'No');

      const response = await axios.post(`${API_URL}/tweets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });

      console.log('Tweet created successfully:', response.data);
      navigate('/tweets');
    } catch (error) {
      console.error('Error creating tweet:', error.response?.data || error);
      setError(error.response?.data?.message || 'Error creating tweet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Tweet
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          {imagePreview ? (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={imagePreview}
                alt="Tweet"
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                type="file"
                id="tweet-image"
                hidden
                onChange={handleImageChange}
              />
              <label htmlFor="tweet-image">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<ImageIcon />}
                >
                  Add Image
                </Button>
              </label>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !content.trim()}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Tweet
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default TweetCreate; 