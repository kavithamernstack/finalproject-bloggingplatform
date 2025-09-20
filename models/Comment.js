import mongoose  from "mongoose";

const commentSchema = new mongoose.Schema({
    post:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    content:{
        type: String, 
        required: true
    },

    isSpam:{
        type: Boolean, 
        default: false
    }
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);