import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Components
import AuthGuard from './components/AuthGuard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import VideoUpload from './pages/VideoUpload';
import VideoWatch from './pages/VideoWatch';
import TweetFeed from './pages/TweetFeed';
import TweetCreate from './pages/TweetCreate';
import Playlists from './pages/Playlists';
import PlaylistView from './pages/PlaylistView';
import EditProfile from './pages/EditProfile';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff0000',
      light: '#ff4444',
      dark: '#cc0000',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#3ea6ff',
      light: '#7ac6ff',
      dark: '#0077cc',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0f0f0f',
      paper: '#1f1f1f',
      alternate: '#272727'
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.5px'
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.5px'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.5px'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.5px'
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
      letterSpacing: '-0.5px'
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '-0.5px'
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.15px'
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.1px'
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.15px'
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.15px'
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.4px'
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#6b6b6b #2b2b2b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            backgroundColor: '#2b2b2b'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#6b6b6b',
            minHeight: 24,
            border: '2px solid #2b2b2b'
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: '#959595'
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#959595'
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#959595'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          },
          transition: 'all 0.2s ease-in-out'
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#666666'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px'
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
          },
          transition: 'all 0.3s ease-in-out'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        },
        elevation3: {
          boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1f1f1f',
          backgroundImage: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1f1f1f',
          backgroundImage: 'none',
          border: 'none'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 0',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: '2px solid #333333'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          },
          transition: 'all 0.2s ease-in-out'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          minWidth: '120px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px'
          }
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/upload" element={<VideoUpload />} />
              <Route path="/watch/:videoId" element={<VideoWatch />} />
              <Route path="/tweets" element={<TweetFeed />} />
              <Route path="/tweet/create" element={<TweetCreate />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlist/:playlistId" element={<PlaylistView />} />
              <Route path="/trending" element={<Home />} />
              <Route path="/subscriptions" element={<Home />} />
              <Route path="/library" element={<Playlists />} />
              <Route path="/history" element={<Home />} />
            </Route>
          </Route>
          
          {/* Catch-all route - redirects to login or home depending on authentication */}
          <Route path="*" element={<AuthGuard redirectTo="/login" />} />
        </Routes>
        <ToastContainer 
          position="bottom-right"
          theme="dark"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
