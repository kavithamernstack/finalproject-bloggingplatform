import mongoose from "mongoose";

const CategorySubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
});

export default mongoose.model("CategorySubscription", CategorySubscriptionSchema);
