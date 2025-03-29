import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/apiError.js";

// Ensure the public/temp directory exists
const tempDir = "./public/temp";
try {
  // Enhanced directory creation with better error handling
  if (!fs.existsSync("./public")) {
    console.log("Creating public directory");
    try {
      fs.mkdirSync("./public", { recursive: true });
      console.log("Successfully created public directory");
    } catch (pubDirError) {
      console.error("Critical error creating public directory:", pubDirError);
      throw new Error("Failed to create upload directories: " + pubDirError.message);
    }
  }
  
  if (!fs.existsSync(tempDir)) {
    console.log("Creating temp directory at:", tempDir);
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log("Successfully created temp directory");
    } catch (tempDirError) {
      console.error("Critical error creating temp directory:", tempDirError);
      throw new Error("Failed to create temp directory: " + tempDirError.message);
    }
  } else {
    console.log("Temp directory already exists at:", tempDir);
  }
} catch (error) {
  console.error("Error creating directories:", error);
}

// Define file size constants
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Multer receiving file:", file.originalname, file.mimetype);
    
    // Double check temp directory exists before trying to write to it
    if (!fs.existsSync(tempDir)) {
      try {
        console.log("Recreating temp directory at:", tempDir);
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (dirError) {
        console.error("Failed to create temp directory:", dirError);
        return cb(new Error("Failed to create upload directory"), null);
      }
    }
    
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Clean file name to remove special characters
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    
    // Generate unique filename with timestamp and original extension
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1000)}${path.extname(cleanFileName)}`;
    console.log("Generated unique filename:", uniqueName, "for original file:", file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log("Filtering file:", file.originalname, file.mimetype);
  
  // Check if it's a video or image file
  if (file.fieldname === "videoFile") {
    const acceptedVideoTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo', 
      'video/x-matroska', 
      'application/octet-stream'
    ];
    
    if (acceptedVideoTypes.includes(file.mimetype)) {
      console.log("Accepting video file:", file.originalname);
      cb(null, true);
    } else {
      console.error("Rejecting non-video file:", file.originalname, file.mimetype);
      cb(new Error("Only video files (MP4, WebM, MOV, AVI, MKV) are allowed for video uploads"), false);
    }
  } else if (file.fieldname === "thumbnail") {
    const acceptedImageTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif'
    ];
    
    if (acceptedImageTypes.includes(file.mimetype)) {
      console.log("Accepting image file:", file.originalname);
      cb(null, true); 
    } else {
      console.error("Rejecting non-image file:", file.originalname, file.mimetype);
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed for thumbnails"), false);
    }
  } else if (file.fieldname === "avatar" || file.fieldname === "coverImage") {
    const acceptedImageTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif'
    ];
    
    if (acceptedImageTypes.includes(file.mimetype)) {
      console.log("Accepting image file for user profile:", file.originalname);
      cb(null, true); 
    } else {
      console.error("Rejecting non-image file for user profile:", file.originalname, file.mimetype);
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed for profile images"), false);
    }
  } else {
    console.log("Accepting other file type:", file.originalname);
    cb(null, true);
  }
};

// Custom file size limits based on file type
const limits = (req, file) => {
  if (file.fieldname === "videoFile") {
    return { fileSize: MAX_VIDEO_SIZE };
  } else if (file.fieldname === "thumbnail" || file.fieldname === "avatar" || file.fieldname === "coverImage") {
    return { fileSize: MAX_IMAGE_SIZE };
  } else {
    return { fileSize: MAX_IMAGE_SIZE }; // Default to image size for other files
  }
};

// Set appropriate limits to prevent server overload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Default max file size
    files: 5 // Maximum 5 files per request
  }
});

// Helper function to clean up temporary files when an error occurs
export const cleanupTempFiles = (files) => {
  if (!files) return;
  
  const filesToClean = Array.isArray(files) ? files : Object.values(files).flat();
  
  filesToClean.forEach(file => {
    if (file && file.path) {
      try {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up temp file: ${file.path}`);
      } catch (err) {
        console.error(`Failed to clean up temp file: ${file.path}`, err);
      }
    }
  });
};