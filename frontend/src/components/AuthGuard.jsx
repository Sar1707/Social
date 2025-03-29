import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

const AuthGuard = ({ redirectTo = '/login' }) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !token) {
      console.log('User not authenticated, redirecting to', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, token, navigate, redirectTo]);

  if (!isAuthenticated) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return <Outlet />;
};

export default AuthGuard; 