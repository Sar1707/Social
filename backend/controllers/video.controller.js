import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import {
    uploadOnCloudinary,
    deleteOnCloudinary,
    isCloudinaryConfigured
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import path from "path";

// get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    console.log(userId);
    const pipeline = [];

    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"] //search only on title, desc
                }
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: true } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});

// get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    console.log("Received video upload request:", {
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'No files',
        user: req.user?._id
    });
    
    // Check if Cloudinary is properly configured first
    if (!isCloudinaryConfigured()) {
        console.error("Cloudinary is not properly configured. Video upload aborted.");
        
        // Try saving files locally as a fallback if Cloudinary is not available
        try {
            const videoFileLocalPath = req.files?.videoFile[0]?.path;
            const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
            
            if (videoFileLocalPath && thumbnailLocalPath) {
                console.log("Using local file storage as fallback for Cloudinary");
                
                // Create a response with local file paths
                const localFallbackVideo = {
                    title: req.body.title,
                    description: req.body.description,
                    videoFile: {
                        url: `/temp/${path.basename(videoFileLocalPath)}`,
                        public_id: 'local-' + Date.now()
                    },
                    thumbnail: {
                        url: `/temp/${path.basename(thumbnailLocalPath)}`,
                        public_id: 'local-thumb-' + Date.now()
                    },
                    _id: new mongoose.Types.ObjectId().toString(),
                    owner: req.user?._id,
                    duration: 0,
                    views: 0,
                    isPublished: true,
                    createdAt: new Date().toISOString()
                };
                
                return res
                    .status(200)
                    .json(new ApiResponse(200, localFallbackVideo, "Video saved locally (Cloudinary unavailable)"));
            }
        } catch (fallbackError) {
            console.error("Local fallback error:", fallbackError);
        }
        
        throw new ApiError(503, "Cloud storage service is currently unavailable. Please try again later.");
    }
    
    const { title, description, category } = req.body;
    
    // Validate all required fields
    if (!title || !description || title.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "Title and description are required");
    }

    // Validate files
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        console.error("Missing files in request:", req.files ? JSON.stringify(Object.keys(req.files)) : 'No files');
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    console.log("Local file paths:", {
        videoFileLocalPath,
        thumbnailLocalPath,
        videoFile: req.files?.videoFile[0],
        thumbnail: req.files?.thumbnail[0]
    });

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    let videoFile = null;
    let thumbnail = null;

    try {
        // Upload video file
        console.log("Uploading video to Cloudinary...");
        videoFile = await uploadOnCloudinary(videoFileLocalPath);
        
        if (!videoFile) {
            console.error("Video upload failed - uploadOnCloudinary returned null");
            throw new ApiError(500, "Failed to upload video to cloud storage. Please try again later.");
        }
        
        console.log("Video upload result:", videoFile);
        
        // Upload thumbnail
        console.log("Uploading thumbnail to Cloudinary...");
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        
        if (!thumbnail) {
            console.error("Thumbnail upload failed - uploadOnCloudinary returned null");
            
            // Try to clean up the video if thumbnail upload fails
            if (videoFile.public_id) {
                await deleteOnCloudinary(videoFile.public_id, videoFile.resource_type || 'video');
                console.log("Deleted video from Cloudinary after thumbnail upload failure");
            }
            
            throw new ApiError(500, "Failed to upload thumbnail to cloud storage. Please try again later.");
        }
        
        console.log("Thumbnail upload result:", thumbnail);

        // Ensure we have valid URLs for both video and thumbnail
        if (!videoFile.url || !thumbnail.url) {
            console.error("Missing URLs in upload results:", {
                videoUrl: videoFile?.url || 'missing',
                thumbnailUrl: thumbnail?.url || 'missing'
            });
            
            // Clean up any uploaded assets
            if (videoFile?.public_id) {
                await deleteOnCloudinary(videoFile.public_id, videoFile.resource_type || 'video');
            }
            if (thumbnail?.public_id) {
                await deleteOnCloudinary(thumbnail.public_id, 'image');
            }
            
            throw new ApiError(500, "Invalid upload results from cloud storage");
        }

        console.log("Creating video document in database...");
        const video = await Video.create({
            title,
            description,
            category: category || "Other",
            duration: videoFile.duration || 0,
            videoFile: {
                url: videoFile.url,
                public_id: videoFile.public_id
            },
            thumbnail: {
                url: thumbnail.url,
                public_id: thumbnail.public_id
            },
            owner: req.user?._id,
            isPublished: true
        });

        console.log("Video document created:", JSON.stringify(video));
        
        // Update user's videos array
        await User.findByIdAndUpdate(
            req.user?._id,
            { $push: { videos: video._id } },
            { new: true }
        );
        
        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video uploaded successfully"));
    } catch (error) {
        console.error("Error in video upload process:", error);
        
        // Clean up any uploaded assets if video creation fails
        if (videoFile?.public_id && !error.message.includes("Failed to upload")) {
            await deleteOnCloudinary(videoFile.public_id, videoFile.resource_type || 'video')
                .catch(err => console.error("Error cleaning up video:", err));
        }
        if (thumbnail?.public_id && !error.message.includes("Failed to upload")) {
            await deleteOnCloudinary(thumbnail.public_id, 'image')
                .catch(err => console.error("Error cleaning up thumbnail:", err));
        }
        
        throw new ApiError(error.statusCode || 500, error.message || "Something went wrong while uploading the video");
    }
});

// get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    console.log(`Fetching video with ID: ${videoId}`);

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Fetch the video details with owner details included
    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "-password -refreshToken" // Don't return sensitive fields
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Track video view (update the views count)
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    // Add this video to the user's watch history
    if (req.user) {
        // Check if the video is already in the history
        const user = await User.findById(req.user._id);
        const historyIndex = user.watchHistory.indexOf(videoId);
        
        if (historyIndex !== -1) {
            // Remove from current position and move to the front
            user.watchHistory.splice(historyIndex, 1);
        }
        
        // Add to the front of the array (most recent)
        user.watchHistory.unshift(videoId);
        await user.save();
    }

    // Format the video URL fields for better consistency with frontend expectations
    const formattedVideo = {
        ...video.toObject(),
        videoFile: video.videoFile?.url || video.videoFile || null,
        thumbnail: video.thumbnail?.url || video.thumbnail || null
    };

    return res.status(200).json(
        new ApiResponse(200, formattedVideo, "Video details fetched successfully")
    );
});

// update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video please try again");
    }

    if (updatedVideo) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if (!videoDeleted) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.thumbnail.public_id); // video model has thumbnail public_id stored in it->check videoModel
    await deleteOnCloudinary(video.videoFile.public_id, "video"); // specify video while deleting video

    // delete video likes
    await Like.deleteMany({
        video: videoId
    })

     // delete video comments
    await Comment.deleteMany({
        video: videoId,
    })
    
    // Remove video from user's videos array
    await User.findByIdAndUpdate(
        req.user?._id,
        { $pull: { videos: videoId } },
        { new: true }
    );
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});

// Get videos by username
const getUserVideos = asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    console.log(`Fetching videos for username: ${username}`);
    
    if (!username) {
        throw new ApiError(400, "Username is required");
    }
    
    try {
        // First find user by username
        const user = await User.findOne({ username: username.toLowerCase() });
        
        if (!user) {
            console.log(`User not found with username: ${username}`);
            throw new ApiError(404, "User not found");
        }
        
        console.log(`Found user with ID: ${user._id} for username: ${username}`);
        
        // Now fetch videos by user ID
        const videos = await Video.aggregate([
            {
                $match: {
                    owner: user._id
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                "avatar.url": 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$ownerDetails"
                    }
                }
            },
            {
                $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                    owner: 1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);
        
        console.log(`Found ${videos.length} videos for username: ${username}`);
        
        return res
            .status(200)
            .json(new ApiResponse(200, videos, "User videos fetched successfully"));
            
    } catch (error) {
        console.error(`Error in getUserVideos: ${error}`);
        throw new ApiError(500, error.message || "Failed to fetch user videos");
    }
});

export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus,
    getUserVideos,
};