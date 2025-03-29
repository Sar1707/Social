import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  AppBar,
  Box,
  Drawer,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Tooltip,
  InputBase,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Subscriptions as SubscriptionsIcon,
  VideoLibrary as VideoLibraryIcon,
  History as HistoryIcon,
  VideoCall as VideoCallIcon,
  Create as CreateIcon,
  Whatshot as WhatshotIcon,
} from '@mui/icons-material';
import { logout, setCredentials } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const drawerWidth = 240;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Set up token refresh at regular intervals instead of relying solely on interceptors
  useEffect(() => {
    if (!token) return;

    // Set up a timer to refresh token every 25 minutes
    const refreshTimer = setInterval(async () => {
      try {
        console.log('Attempting to refresh token');
        const response = await axios.post(
          `${API_URL}/users/refresh-token`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Token refresh successful');
        const { accessToken, user } = response.data.data;
        dispatch(setCredentials({ user, token: accessToken }));
      } catch (error) {
        console.error('Failed to refresh token on schedule:', error.response || error);
        // Only logout if it's a 401 error (unauthorized)
        if (error.response?.status === 401) {
          console.log('Unauthorized error during token refresh, logging out');
          dispatch(logout());
          navigate('/login');
        }
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(refreshTimer);
  }, [token, dispatch, navigate]);

  // Setup axios interceptor for token errors
  useEffect(() => {
    // Only set up response interceptor (no token refresh logic here)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle authentication errors
        if (error.response?.status === 401 && error.config.url !== `${API_URL}/users/refresh-token`) {
          console.log('401 error detected, logging out:', error.config.url);
          dispatch(logout());
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // Set up a request interceptor to always include the token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
          // Ensure cookies are sent with cross-origin requests
          config.withCredentials = true;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [dispatch, navigate, token]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/users/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  // Helper function to process avatar URL for proper display
  const getValidAvatarUrl = (avatar) => {
    if (!avatar) return null;
    
    // If it's a string URL
    if (typeof avatar === 'string') {
      if (avatar.startsWith('http')) {
        return avatar;
      } else if (avatar.startsWith('/temp/')) {
        return `${window.location.origin}${avatar}`;
      }
    }
    
    // If it's an object with url property
    if (avatar && typeof avatar === 'object' && avatar.url) {
      if (typeof avatar.url === 'string') {
        if (avatar.url.startsWith('http')) {
          return avatar.url;
        } else if (avatar.url.startsWith('/temp/')) {
          return `${window.location.origin}${avatar.url}`;
        }
      }
    }
    
    // Default avatar fallback
    return null;
  };

  const drawer = (
    <div>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          SOCIAL
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/')} selected={location.pathname === '/'}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => navigate('/trending')} selected={location.pathname === '/trending'}>
          <ListItemIcon>
            <WhatshotIcon />
          </ListItemIcon>
          <ListItemText primary="Trending" />
        </ListItem>
        <ListItem button onClick={() => navigate('/subscriptions')} selected={location.pathname === '/subscriptions'}>
          <ListItemIcon>
            <SubscriptionsIcon />
          </ListItemIcon>
          <ListItemText primary="Subscriptions" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/library')} selected={location.pathname === '/library'}>
          <ListItemIcon>
            <VideoLibraryIcon />
          </ListItemIcon>
          <ListItemText primary="Library" />
        </ListItem>
        <ListItem button onClick={() => navigate('/history')} selected={location.pathname === '/history'}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="History" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 20,
                bgcolor: 'background.default',
                mr: 2,
                ml: { xs: 0, sm: 3 },
                width: { xs: '100%', sm: 400 },
                display: 'flex',
                alignItems: 'center',
                p: '2px 10px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Search"
                inputProps={{ 'aria-label': 'search' }}
              />
              <IconButton
                type="button"
                sx={{ p: '6px' }}
                aria-label="search"
              >
                <SearchIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/upload')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <VideoCallIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => navigate('/tweet/create')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <CreateIcon />
            </IconButton>
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user?.fullName} src={getValidAvatarUrl(user?.avatar) || ''}>
                  {user?.fullName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { 
                handleCloseUserMenu(); 
                if (user && user.username) {
                  navigate(`/profile/${user.username}`); 
                } else {
                  // If user info isn't available, fetch current user first
                  const fetchUser = async () => {
                    try {
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
                      const response = await axios.get(`${API_URL}/users/current-user`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const username = response.data.data.username;
                      if (username) {
                        navigate(`/profile/${username}`);
                      }
                    } catch (error) {
                      console.error('Error fetching user data:', error);
                    }
                  };
                  fetchUser();
                }
              }}>
                <Typography textAlign="center">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout; 