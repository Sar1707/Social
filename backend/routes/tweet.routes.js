import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    getAllTweets
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(upload.fields([{ name: "image", maxCount: 1 }]), createTweet)
    .get(getAllTweets);
    
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(upload.none(), updateTweet).delete(deleteTweet);

export default router;