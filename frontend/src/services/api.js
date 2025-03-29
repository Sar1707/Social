import axios from 'axios';
import { store } from '../store/store';
import { logout, setCredentials } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

console.log('Initializing API service with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Don't add token for auth endpoints
    if (config.url === '/users/login' || config.url === '/users/register') {
      console.log('Auth endpoint detected, not adding token');
      return config;
    }
    
    // Add authorization header for authenticated requests
    const token = localStorage.getItem('token');
    if (token) {
      console.log(`Adding auth token to ${config.method.toUpperCase()} ${config.url}`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`No auth token available for ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.method.toUpperCase()} ${response.config.url}:`, 
      { status: response.status, success: response.data?.success });
    
    // Handle tokens from response data (for login/register)
    if (response.data?.data?.accessToken) {
      console.log('Found access token in response data');
      localStorage.setItem('token', response.data.data.accessToken);
    }
    if (response.data?.data?.refreshToken) {
      console.log('Found refresh token in response data');
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    // Handle tokens from cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    if (cookies.accessToken) {
      console.log('Found access token in cookies');
      localStorage.setItem('token', cookies.accessToken);
    }
    if (cookies.refreshToken) {
      console.log('Found refresh token in cookies');
      localStorage.setItem('refreshToken', cookies.refreshToken);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`Error in ${originalRequest.method.toUpperCase()} ${originalRequest.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh access token...');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('No refresh token available');
          throw new Error('No refresh token available');
        }
        
        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/users/refresh-token`,
          { refreshToken },
          { 
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          }
        );
        
        if (!response.data?.success) {
          throw new Error('Token refresh failed');
        }
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        console.log('Token refresh successful, updating tokens');
        
        // Update tokens in localStorage
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update the user state in Redux
        if (response.data.data.user) {
          store.dispatch(setCredentials({
            user: response.data.data.user,
            token: accessToken,
            refreshToken: newRefreshToken || refreshToken
          }));
        }
        
        // Update the Authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 