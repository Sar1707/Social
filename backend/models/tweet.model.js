import mongoose, {Schema} from "mongoose"

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "content is required"]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        image: {
            type: {
                url: String,
                public_id: String
            }
        }
    },
    { 
        timestamps: true
    }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);