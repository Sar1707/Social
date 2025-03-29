import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    publishAVideo,
    togglePublishStatus,
    getUserVideos
} from "../controllers/video.controller.js";

const router = Router();

// Middleware to handle file upload errors
const handleFileUploadErrors = (req, res, next) => {
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ])(req, res, (err) => {
        if (err) {
            console.error("Multer error in video upload:", err);
            
            // Format a user-friendly error message
            let errorMessage = "Error uploading files. ";
            
            if (err.code === "LIMIT_FILE_SIZE") {
                errorMessage += "File size is too large. Maximum allowed size is 500MB.";
            } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                errorMessage += "Unexpected file field. Only videoFile and thumbnail are allowed.";
            } else if (err.message.includes("only")) {
                // This catches custom error messages from the file filter
                errorMessage += err.message;
            } else {
                errorMessage += "Please try again with valid files.";
            }
            
            return res.status(400).json({
                success: false,
                message: errorMessage,
                error: err.message
            });
        }
        next();
    });
};

// Main video routes
router.route("/")
    .get(verifyJWT, getAllVideos)
    .post(
        verifyJWT,
        handleFileUploadErrors,
        publishAVideo
    );

// Route for getting, updating, and deleting specific videos
router.route("/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(
        verifyJWT,
        upload.single("thumbnail"),
        updateVideo
    );

// Route for toggling video publish status
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// Get videos by username
router.route("/user/:username").get(verifyJWT, getUserVideos);

export default router;