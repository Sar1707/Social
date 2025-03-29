import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function EditProfile() {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: '',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/current-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data.data;
      setFormData({
        fullName: userData.fullName,
        username: userData.username,
        email: userData.email,
        bio: userData.bio || '',
        avatar: null,
      });
      setAvatarPreview(userData.avatar?.url || '');
    } catch (error) {
      setError(error.response?.data?.message || 'Error loading profile data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image size should be less than 5MB');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        avatar: file,
      }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.patch(`${API_URL}/users/update-user`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (formData.avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', formData.avatar);
        
        await axios.patch(`${API_URL}/users/update-avatar`, avatarFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigate(`/profile/${formData.username}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Edit Profile</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarPreview}
                alt="Profile"
                sx={{ width: 120, height: 120 }}
              />
              <input
                accept="image/*"
                type="file"
                id="avatar-upload"
                hidden
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click to change profile picture
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Save Changes
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default EditProfile; 