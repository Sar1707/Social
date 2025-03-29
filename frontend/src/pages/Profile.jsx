import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Container,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Theaters as TheatersIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Helper function to process images for proper display
  const getValidImageUrl = (imageData) => {
    if (!imageData) return null;
    
    // If it's a string URL
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) {
        return imageData;
      } else if (imageData.startsWith('/temp/')) {
        return `${window.location.origin}${imageData}`;
      }
    }
    
    // If it's an object with url property
    if (imageData && typeof imageData === 'object' && imageData.url) {
      if (typeof imageData.url === 'string') {
        if (imageData.url.startsWith('http')) {
          return imageData.url;
        } else if (imageData.url.startsWith('/temp/')) {
          return `${window.location.origin}${imageData.url}`;
        }
      }
    }
    
    // Default avatar fallback
    return null;
  };

  useEffect(() => {
    // If no username in URL but we have user data, redirect to user's profile
    if (!username && user?.username) {
      navigate(`/profile/${user.username}`);
      return;
    }
    
    fetchProfileData();
  }, [username, token, user]);

  const fetchProfileData = async () => {
    try {
      if (!username) {
        setError('No username provided. Please try again.');
        setLoading(false);
        return;
      }

      console.log(`Fetching profile data for: ${username}`);
      
      // First get the user profile
      const profileRes = await axios.get(`${API_URL}/users/c/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      console.log('Profile data:', profileRes.data);
      
      if (!profileRes.data.data) {
        throw new Error('Profile data is empty');
      }
      
      const userData = profileRes.data.data;
      
      // Ensure avatar and cover image URLs are properly processed
      if (userData.avatar) {
        userData.avatar.processedUrl = getValidImageUrl(userData.avatar);
      }
      
      if (userData.coverImage) {
        userData.coverImage.processedUrl = getValidImageUrl(userData.coverImage);
      }
      
      setProfile(userData);
      
      // Now use the username to fetch videos, playlists, and tweets
      console.log(`Fetching content for username: ${username} and id: ${userData._id}`);
      
      try {
        const videosRes = await axios.get(`${API_URL}/video/user/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        console.log('Videos data:', videosRes.data);
        setVideos(videosRes.data.data || []);
      } catch (videoError) {
        console.error('Error fetching videos:', videoError);
        setVideos([]);
      }
      
      try {
        const tweetsRes = await axios.get(`${API_URL}/tweet/user/${userData._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        console.log('Tweets data:', tweetsRes.data);
        setTweets(tweetsRes.data.data || []);
      } catch (tweetError) {
        console.error('Error fetching tweets:', tweetError);
        setTweets([]);
      }
      
      try {
        // Also fetch playlists
        const playlistsRes = await axios.get(`${API_URL}/playlist/username/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        console.log('Playlists data:', playlistsRes.data);
        setPlaylists(playlistsRes.data.data || []);
      } catch (playlistError) {
        console.error('Error fetching playlists:', playlistError);
        setPlaylists([]);
      }
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      if (error.response?.status === 404) {
        setError(`User "${username}" not found.`);
      } else {
        setError(error.response?.data?.message || error.message || 'Error loading profile. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await axios.post(
        `${API_URL}/subscriptions/c/${profile._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      fetchProfileData(); // Refresh profile data after subscribing
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Profile not found
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }

  const isOwnProfile = user?._id === profile._id;

  return (
    <Container maxWidth="lg" sx={{ pb: 5 }}>
      {/* Cover Image */}
      <Box
        sx={{
          height: { xs: 150, sm: 200, md: 250 },
          width: '100%',
          position: 'relative',
          backgroundImage: `url(${profile.coverImage?.processedUrl || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(200,200,200,0.5)',
          borderRadius: { xs: '0 0 16px 16px', sm: '0 0 24px 24px' },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          mb: { xs: 7, sm: 8 },
        }}
      />

      {/* Profile Card with Avatar */}
      <Card 
        elevation={3} 
        sx={{ 
          mb: 3, 
          mt: { xs: -6, sm: -7 }, 
          mx: 'auto', 
          maxWidth: 'calc(100% - 32px)',
          borderRadius: 2,
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-end' }, mb: 3 }}>
            <Avatar
              src={profile.avatar?.processedUrl || ''}
              alt={profile.username}
              sx={{
                width: { xs: 100, sm: 130, md: 150 },
                height: { xs: 100, sm: 130, md: 150 },
                border: 4,
                borderColor: 'background.paper',
                mt: { xs: -8, sm: -9, md: -10 },
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                mb: { xs: 2, sm: 0 },
              }}
            />
            <Box sx={{ ml: { xs: 0, sm: 3 }, flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                alignItems: { xs: 'center', sm: 'center' }, 
                mb: 1,
                gap: { xs: 1, sm: 2 }
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {profile.fullName}
                </Typography>
                {isOwnProfile ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ ml: { xs: 0, sm: 'auto' } }}
                    onClick={() => navigate('/edit-profile')}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    variant={profile.isSubscribed ? 'outlined' : 'contained'}
                    startIcon={<PersonAddIcon />}
                    onClick={handleSubscribe}
                    sx={{ ml: { xs: 0, sm: 'auto' } }}
                    color={profile.isSubscribed ? 'primary' : 'secondary'}
                  >
                    {profile.isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                )}
              </Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                @{profile.username}
              </Typography>
              <Stack 
                direction="row" 
                spacing={3} 
                sx={{ 
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  mt: 2
                }}
              >
                <Chip 
                  icon={<PersonIcon fontSize="small" />}
                  label={`${profile.subcribersCount || 0} Subscribers`} 
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
                <Chip 
                  icon={<TheatersIcon fontSize="small" />}
                  label={`${videos.length} Videos`} 
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
              </Stack>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Tabs Navigation */}
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
          borderRadius: 2,
          mb: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
          sx={{ 
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
              py: 1.5,
            },
            '& .Mui-selected': {
              fontWeight: 600
            }
          }}
        >
          <Tab icon={<TheatersIcon />} label="Videos" iconPosition="start" />
          <Tab icon={<ChatIcon />} label="Tweets" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="About" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Videos Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                  },
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <CardActionArea 
                  onClick={() => navigate(`/video/${video._id}`)}
                  sx={{ flexGrow: 1 }}
                >
                  <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                    <ReactPlayer
                      url={video.videoFile?.url}
                      width="100%"
                      height="100%"
                      light={video.thumbnail?.url}
                      controls
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {video.views || 0} views • {new Date(video.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {videos.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <TheatersIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No videos uploaded yet
                </Typography>
                {isOwnProfile && (
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/upload')}
                  >
                    Upload a Video
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Tweets Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          {tweets.map((tweet) => (
            <Grid item xs={12} key={tweet._id}>
              <Card sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Avatar
                      src={profile.avatar?.processedUrl || ''}
                      alt={profile.username}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {profile.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{profile.username} • {new Date(tweet.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {isOwnProfile && (
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ mt: 1.5, mb: 2 }}>
                        {tweet.content}
                      </Typography>
                      {tweet.image && (
                        <Box 
                          sx={{ 
                            mt: 1, 
                            mb: 2,
                            borderRadius: 1,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }}
                        >
                          <img
                            src={tweet.image?.url || ''}
                            alt="Tweet"
                            style={{ 
                              width: '100%', 
                              maxHeight: 400,
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ThumbUpIcon />}
                          color={tweet.isLiked ? 'primary' : 'inherit'}
                          sx={{ borderRadius: 4 }}
                        >
                          {tweet.likesCount || 0}
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<CommentIcon />} 
                          sx={{ borderRadius: 4 }}
                        >
                          {tweet.comments || 0}
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<ShareIcon />}
                          sx={{ borderRadius: 4, ml: 'auto' }}
                        >
                          Share
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {tweets.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No tweets yet
                </Typography>
                {isOwnProfile && (
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/tweet/create')}
                  >
                    Create a Tweet
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* About Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              About
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph>
              {profile.bio || 'No bio available'}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
              Account Details
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
                    @{profile.username}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
                    {profile.fullName}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Subscribers
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
                    {profile.subcribersCount || 0}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Following
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
                    {profile.channelsSubscribedToCount || 0}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
            
            {/* Show playlists if available */}
            {playlists.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
                  Playlists
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {playlists.map(playlist => (
                    <Grid item xs={12} sm={6} md={4} key={playlist._id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)'
                          }
                        }}
                        onClick={() => navigate(`/playlist/${playlist._id}`)}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {playlist.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {playlist.totalVideos} videos • {playlist.totalViews || 0} views
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
}

export default Profile; 