import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    excerpt: String,
    content: {
        type: String,
        required: true
    },

    coverImage: String,

    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },

    author: {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: true
    },

     categories: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  ],

    banner: { type: String },

    tags: [String],
    metrics: {
        views: {
            type: Number,
            default: 0
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        shares: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true });

export default mongoose.model("Post", postSchema);