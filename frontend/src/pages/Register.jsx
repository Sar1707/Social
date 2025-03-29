import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Alert,
  IconButton,
  Avatar,
  Paper,
  Container,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import api from "../services/api";
import { setCredentials } from "../store/authSlice";

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });
  const [files, setFiles] = useState({
    avatar: null,
    coverImage: null,
  });
  const [previews, setPreviews] = useState({
    avatar: null,
    coverImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match("image.*")) {
        setError(
          `${type === "avatar" ? "Avatar" : "Cover image"} must be an image file`
        );
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${type === "avatar" ? "Avatar" : "Cover image"} file size must be less than 5MB`);
        return;
      }
      
      setFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
      setPreviews((prev) => ({
        ...prev,
        [type]: URL.createObjectURL(file),
      }));

      // Clear any previous errors
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!formData.password.trim() || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (!files.avatar) {
      setError("Avatar is required");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Add files
      console.log("Adding avatar file to form data:", files.avatar.name);
      formDataToSend.append("avatar", files.avatar);

      if (files.coverImage) {
        console.log("Adding cover image file to form data:", files.coverImage.name);
        formDataToSend.append("coverImage", files.coverImage);
      }

      // Log FormData contents for debugging
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log("Making registration request...");
      const response = await api.post("/users/register", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration response:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Registration failed");
      }

      // Get user data from response
      const userData = response.data.data;
      
      // Store user and tokens in Redux
      dispatch(
        setCredentials({
          user: userData,
          token: userData.accessToken || "",
          refreshToken: userData.refreshToken || "",
        })
      );
      
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred during registration. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper elevation={3} sx={{ width: "100%", p: 4 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create your account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              to continue to SOCIAL
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              bgcolor: "background.default",
              p: 3,
              borderRadius: 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="avatar-upload"
                type="file"
                onChange={(e) => handleFileChange(e, "avatar")}
              />
              <label htmlFor="avatar-upload">
                <Avatar
                  src={previews.avatar}
                  sx={{
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    "&:hover": {
                      opacity: 0.8,
                      "& .upload-icon": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {!previews.avatar && <CloudUploadIcon />}
                </Avatar>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    mt: 1,
                  }}
                >
                  Upload Profile Picture*
                </Typography>
              </label>
            </Box>

            <Box sx={{ width: "100%" }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="cover-upload"
                type="file"
                onChange={(e) => handleFileChange(e, "coverImage")}
              />
              <label htmlFor="cover-upload">
                <Box
                  sx={{
                    height: 100,
                    width: "100%",
                    borderRadius: 1,
                    overflow: "hidden",
                    backgroundImage: previews.coverImage
                      ? `url(${previews.coverImage})`
                      : "none",
                    backgroundColor: "background.paper",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "1px dashed",
                    borderColor: "divider",
                    "&:hover": {
                      opacity: 0.9,
                    },
                  }}
                >
                  {!previews.coverImage && (
                    <Box sx={{ textAlign: "center" }}>
                      <CloudUploadIcon color="action" sx={{ fontSize: 40 }} />
                      <Typography variant="caption" color="text.secondary">
                        Upload Cover Image (Optional)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </label>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            variant="outlined"
            helperText="Choose a unique username"
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            variant="outlined"
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            variant="outlined"
            autoComplete="new-password"
            helperText="At least 8 characters"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              fontSize: "1.1rem",
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Create Account"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ fontWeight: 500 }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Register;
