import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
});

export const { 
  setCredentials, 
  logout, 
  updateUser, 
  setAuthLoading, 
  setAuthError, 
  clearAuthError 
} = authSlice.actions;

export default authSlice.reducer; 