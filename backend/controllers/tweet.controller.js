import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { Tweet } from "../models/tweet.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    let imageLocalPath;
    
    if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
        imageLocalPath = req.files.image[0].path;
    }

    if (!content) {
        if (imageLocalPath) {
            // Delete the uploaded file if content is missing
            await deleteOnCloudinary(imageLocalPath);
        }
        throw new ApiError(400, "content is required");
    }

    let image;
    if (imageLocalPath) {
        image = await uploadOnCloudinary(imageLocalPath);
        if (!image) {
            throw new ApiError(400, "Error while uploading image");
        }
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
        ...(image && {
            image: {
                url: image.url,
                public_id: image.public_id
            }
        })
    });

    if (!tweet) {
        // Delete the uploaded image if tweet creation fails
        if (image) {
            await deleteOnCloudinary(image.public_id);
        }
        throw new ApiError(500, "failed to create tweet please try again");
    }

    // Add tweet to user's tweets array
    await User.findByIdAndUpdate(
        req.user?._id,
        { $push: { tweets: tweet._id } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!newTweet) {
        throw new ApiError(500, "Failed to edit tweet please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);
    
    // Remove tweet from user's tweets array
    await User.findByIdAndUpdate(
        req.user?._id,
        { $pull: { tweets: tweetId } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    console.log(`Fetching tweets for userID: ${userId}`);

    if (!isValidObjectId(userId)) {
        console.log(`Invalid userId format: ${userId}`);
        throw new ApiError(400, "Invalid userId");
    }

    try {
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
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
                                "avatar.url": 1,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likeDetails",
                    pipeline: [
                        {
                            $project: {
                                likedBy: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$likeDetails",
                    },
                    ownerDetails: {
                        $first: "$ownerDetails",
                    },
                    isLiked: {
                        $cond: {
                            if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                            then: true,
                            else: false
                        }
                    }
                },
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    content: 1,
                    image: 1,
                    ownerDetails: 1,
                    likesCount: 1,
                    createdAt: 1,
                    isLiked: 1
                },
            },
        ]);

        console.log(`Found ${tweets.length} tweets for user ${userId}`);

        return res
            .status(200)
            .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
    } catch (error) {
        console.error(`Error fetching tweets for user ${userId}:`, error);
        throw new ApiError(500, "Error fetching tweets");
    }
});

const getAllTweets = asyncHandler(async (req, res) => {
    // Get all tweets with user details and like counts
    const tweets = await Tweet.aggregate([
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
                            "avatar.url": 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },
                owner: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                image: 1,
                owner: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets, getAllTweets };