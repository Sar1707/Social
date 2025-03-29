import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Fab,
  useTheme,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function TweetFeed() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tweetContent, setTweetContent] = useState('');
  const [tweetImage, setTweetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentTweetId, setCurrentTweetId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTweet, setShareTweet] = useState(null);
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const theme = useTheme();

  useEffect(() => {
    fetchTweets();
  }, [token]);

  const fetchTweets = async () => {
    try {
      console.log('Fetching tweets...');
      const response = await axios.get(`${API_URL}/tweets`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      console.log('Tweet data received:', response.data);
      setTweets(response.data.data);
    } catch (error) {
      console.error('Error fetching tweets:', error.response || error);
      setError(error.response?.data?.message || 'Error loading tweets');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTweetContent('');
    setTweetImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      setTweetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitTweet = async (e) => {
    e.preventDefault();
    if (!tweetContent.trim() && !tweetImage) return;

    try {
      const formData = new FormData();
      formData.append('content', tweetContent);
      if (tweetImage) {
        formData.append('image', tweetImage);
      }

      const response = await axios.post(`${API_URL}/tweets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });

      setTweets((prev) => [response.data.data, ...prev]);
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Error posting tweet');
    }
  };

  const handleLike = async (tweetId) => {
    try {
      await axios.post(
        `${API_URL}/likes/toggle/t/${tweetId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      // Refresh tweets after liking
      fetchTweets();
    } catch (error) {
      console.error('Error liking tweet:', error.response || error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setCommenting(true);
    try {
      const response = await axios.post(
        `${API_URL}/comments`, 
        {
          content: commentText,
          tweet: currentTweetId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      
      console.log('Comment posted:', response.data);
      
      // Update the tweet with new comment count
      setTweets(prevTweets => 
        prevTweets.map(tweet => 
          tweet._id === currentTweetId 
            ? { ...tweet, commentsCount: (tweet.commentsCount || 0) + 1 }
            : tweet
        )
      );
      
      setCommentText('');
      setCommentDialogOpen(false);
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
    } finally {
      setCommenting(false);
    }
  };

  const handleShare = (tweet) => {
    setShareTweet(tweet);
    setShareDialogOpen(true);
  };

  const copyToClipboard = () => {
    const tweetUrl = `${window.location.origin}/tweet/${shareTweet._id}`;
    navigator.clipboard.writeText(tweetUrl)
      .then(() => {
        alert('Tweet link copied to clipboard!');
        setShareDialogOpen(false);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
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
    <Container maxWidth="md" sx={{ py: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* New Tweet Input Card */}
      <Card 
        elevation={3} 
        sx={{ 
          mb: 3, 
          borderRadius: 2, 
          overflow: 'visible',
          boxShadow: theme.shadows[4]
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar
              src={user?.avatar?.url || ''}
              alt={user?.username}
              sx={{ 
                width: 48, 
                height: 48,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Button
              variant="outlined"
              fullWidth
              onClick={handleOpenDialog}
              sx={{ 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                p: 1.5,
                borderRadius: 3, 
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                fontSize: '1rem',
                fontWeight: 400,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              What's happening?
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tweets List */}
      <Grid container spacing={2}>
        {tweets.map((tweet) => (
          <Grid item xs={12} key={tweet._id}>
            <Card 
              sx={{ 
                p: 0, 
                borderRadius: 2, 
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  boxShadow: theme.shadows[3],
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar
                    src={tweet.owner?.avatar?.url || ''}
                    alt={tweet.owner?.username}
                    sx={{ width: 48, height: 48, mr: 2 }}
                    onClick={() => navigate(`/profile/${tweet.owner?.username}`)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/profile/${tweet.owner?.username}`)}
                        >
                          {tweet.owner?.fullName}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${tweet.owner?.username}`)}
                        >
                          @{tweet.owner?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {new Date(tweet.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 1.5, mb: 2, whiteSpace: 'pre-wrap' }}>
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
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ThumbUpIcon />}
                        color={tweet.isLiked ? "primary" : "inherit"}
                        onClick={() => handleLike(tweet._id)}
                        sx={{ borderRadius: 4 }}
                      >
                        {tweet.likesCount || 0}
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<CommentIcon />} 
                        sx={{ borderRadius: 4 }}
                        onClick={() => {
                          setCurrentTweetId(tweet._id);
                          setCommentDialogOpen(true);
                        }}
                      >
                        {tweet.commentsCount || 0}
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<ShareIcon />}
                        sx={{ borderRadius: 4, ml: 'auto' }}
                        onClick={() => handleShare(tweet)}
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
            <Box sx={{ 
              textAlign: 'center', 
              py: 6, 
              px: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tweets yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Be the first one to post something!
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenDialog}
                startIcon={<AddIcon />}
              >
                Create a Tweet
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpenDialog}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Create Tweet Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Create Tweet</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              size="small"
              sx={{
                color: theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmitTweet}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Avatar
                src={user?.avatar?.url || ''}
                alt={user?.username}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Typography variant="subtitle1">
                {user?.fullName}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  @{user?.username}
                </Typography>
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="What's happening?"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              variant="outlined"
              InputProps={{
                sx: { 
                  borderRadius: 2,
                  p: 1,
                  '& .MuiOutlinedInput-input': {
                    fontSize: '1.1rem'
                  }
                }
              }}
              sx={{ mb: 2 }}
            />
            {imagePreview && (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: 8,
                    maxHeight: 300,
                    objectFit: 'contain' 
                  }}
                />
                <IconButton
                  onClick={() => {
                    setTweetImage(null);
                    setImagePreview(null);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
            {tweetContent.length > 0 && 
              <Chip 
                label={`${tweetContent.length}/280 characters`} 
                color={tweetContent.length > 280 ? "error" : "default"}
                size="small"
                sx={{ mb: 2 }}
              />
            }
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            component="label"
            startIcon={<ImageIcon />}
            variant="outlined"
            sx={{ borderRadius: 4 }}
          >
            Add Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          <Box>
            <Button 
              onClick={handleCloseDialog}
              sx={{ mr: 1, borderRadius: 4 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitTweet}
              disabled={(!tweetContent.trim() && !tweetImage) || tweetContent.length > 280}
              sx={{ borderRadius: 4 }}
            >
              Tweet
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={3}
            placeholder="Write your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleComment} 
            variant="contained" 
            disabled={commenting || !commentText.trim()}
          >
            {commenting ? <CircularProgress size={24} /> : 'Post Comment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Share Tweet</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={copyToClipboard} 
              startIcon={<ContentCopyIcon />}
            >
              Copy Link
            </Button>
            {/* Add more share options as needed */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TweetFeed; 