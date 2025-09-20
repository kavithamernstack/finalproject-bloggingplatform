import mongoose from "mongoose";

const subscribeSchema = new mongoose.Schema({
    follower:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },

    following:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    }
}, {timestamps: true})

subscribeSchema.index(
    { follower:1, following:1},
    {unique: true}
)

export default mongoose.model('Subscription', subscribeSchema)