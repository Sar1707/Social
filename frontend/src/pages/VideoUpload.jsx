import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

function VideoUpload() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: null,
    videoFile: null,
    category: '',
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('idle'); // idle, validating, uploading, processing, complete, error
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const categories = [
    'Entertainment',
    'Music',
    'Gaming',
    'Education',
    'Sports',
    'News',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        setError('Video file size must be less than 500MB');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        videoFile: file,
      }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Thumbnail file size must be less than 5MB');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        thumbnail: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStep('validating');

    try {
      console.log('Submitting video with data:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        videoFile: formData.videoFile ? {
          name: formData.videoFile.name, 
          size: formData.videoFile.size, 
          type: formData.videoFile.type
        } : null,
        thumbnail: formData.thumbnail ? {
          name: formData.thumbnail.name, 
          size: formData.thumbnail.size, 
          type: formData.thumbnail.type
        } : null,
      });
      
      // Token validation
      if (!token) {
        setError('You must be signed in to upload a video');
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      // Validate video and thumbnail files again
      if (!formData.videoFile) {
        setError('Video file is required');
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      if (!formData.thumbnail) {
        setError('Thumbnail is required');
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      // Additional validation for file types
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!validVideoTypes.includes(formData.videoFile.type)) {
        setError(`Invalid video file type: ${formData.videoFile.type}. Supported formats: MP4, WebM, QuickTime, AVI, MKV`);
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      if (!validImageTypes.includes(formData.thumbnail.type)) {
        setError(`Invalid thumbnail type: ${formData.thumbnail.type}. Supported formats: JPEG, PNG, WebP, GIF`);
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      // Size validation
      if (formData.videoFile.size > 500 * 1024 * 1024) {
        setError('Video file size exceeds 500MB limit');
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      if (formData.thumbnail.size > 5 * 1024 * 1024) {
        setError('Thumbnail file size exceeds 5MB limit');
        setUploadStep('error');
        setLoading(false);
        return;
      }
      
      setUploadStep('uploading');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      
      if (formData.thumbnail) {
        console.log('Appending thumbnail:', formData.thumbnail.name, formData.thumbnail.type);
        formDataToSend.append('thumbnail', formData.thumbnail);
      }
      
      if (formData.videoFile) {
        console.log('Appending video file:', formData.videoFile.name, formData.videoFile.type, formData.videoFile.size);
        formDataToSend.append('videoFile', formData.videoFile);
      }

      console.log('Sending request to API:', `${API_URL}/videos`);
      
      // Set a longer timeout for large uploads
      const response = await axios.post(`${API_URL}/videos`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
          setUploadProgress(percentCompleted);
          
          // When upload is complete (100%), set to processing state
          if (percentCompleted === 100) {
            setUploadStep('processing');
          }
        },
        timeout: 300000, // 5 minutes timeout for large videos
      });

      console.log('Upload response:', response.data);
      setUploadStep('complete');
      
      if (response.data && response.data.data && response.data.data._id) {
        // Success - redirect to the video page
        navigate(`/watch/${response.data.data._id}`);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Received invalid response from server');
        setUploadStep('error');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadStep('error');
      
      if (error.response?.status === 413) {
        setError('The file is too large. Maximum allowed size is 500MB.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Authentication error. Please sign in again.');
      } else if (error.response?.status === 503) {
        setError('Cloud storage service is currently unavailable. Please try again later.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message.includes('timeout')) {
        setError('Upload timed out. The video may be too large or your connection is slow.');
      } else if (error.message.includes('Network Error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error uploading video. Please try again with a smaller file.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Upload Video
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {uploadStep === 'uploading' && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading: {uploadProgress}%
          </Typography>
          <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${uploadProgress}%`,
                bgcolor: 'primary.main',
                height: 8,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>
      )}

      {uploadStep === 'processing' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Video uploaded. Processing video for playback...
        </Alert>
      )}

      {uploadStep === 'complete' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Upload complete! Redirecting to your video...
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
              required
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Video File
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 2 }}
            >
              Select Video
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={handleVideoChange}
                required
              />
            </Button>
            {formData.videoFile && (
              <Typography variant="body2" color="text.secondary">
                {formData.videoFile.name}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Thumbnail (Optional)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 2 }}
            >
              Select Thumbnail
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </Button>
            {formData.thumbnail && (
              <Typography variant="body2" color="text.secondary">
                {formData.thumbnail.name}
              </Typography>
            )}
          </Box>

          {preview && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Preview
              </Typography>
              <video
                src={preview}
                controls
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload Video'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default VideoUpload; 