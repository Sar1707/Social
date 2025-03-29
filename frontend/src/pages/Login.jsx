import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Container
} from '@mui/material';
import api from '../services/api';
import { setCredentials } from '../store/authSlice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState(0); // 0 for email, 1 for username
  const [apiUrl, setApiUrl] = useState('');
  
  // Get API URL for debugging
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
    setApiUrl(url);
    console.log('Current API URL:', url);
  }, []);

  const handleTabChange = (event, newValue) => {
    setLoginMethod(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Determine if using email or username login
    const loginData = {
      password: formData.password
    };
    
    if (loginMethod === 0) {
      loginData.email = formData.email;
      console.log('Attempting login with email:', formData.email);
    } else {
      loginData.username = formData.username;
      console.log('Attempting login with username:', formData.username);
    }

    try {
      // Log the endpoint we're hitting for debugging
      const loginEndpoint = '/users/login';
      console.log(`Making login request to: ${apiUrl}${loginEndpoint}`);
      
      const response = await api.post(loginEndpoint, loginData);
      
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      // Get user data from response
      const userData = response.data.data;
      
      // Store user and tokens in Redux
      dispatch(setCredentials({ 
        user: userData.user, 
        token: userData.accessToken,
        refreshToken: userData.refreshToken
      }));
      
      console.log('Authentication successful, navigating to home');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'An error occurred during login. Please check your credentials and try again.';
      
      // More detailed error message based on error type
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = 'Login endpoint not found. API configuration issue.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your username/email and password.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      py: 4,
    }}>
      <Paper elevation={3} sx={{ width: "100%", p: 4 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h5" component="h1" align="center" gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
            to continue to SOCIAL
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {apiUrl && apiUrl !== 'http://localhost:8001/api/v1' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              API URL configured to: {apiUrl}
            </Alert>
          )}

          <Tabs value={loginMethod} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Email" />
            <Tab label="Username" />
          </Tabs>

          {loginMethod === 0 ? (
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              autoFocus
            />
          ) : (
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              autoFocus
            />
          )}

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign in'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login; 