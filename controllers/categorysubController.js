import express from "express";
import Blog from "../models/Blog.js";
import CategorySubscription from "../models/CategorySubscription.js";
import authMiddleware from "../middleware/authMiddleware.js"; // JWT auth middleware

const router = express.Router();

// GET blogs from user’s subscribed categories
router.get("/categories", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Get subscribed category IDs
    const subs = await CategorySubscription.find({ user: userId });
    const categoryIds = subs.map((s) => s.category);

    if (!categoryIds.length) return res.json([]); // no subscriptions

    // 2️⃣ Get blogs in those categories (handle array field)
    const blogs = await Blog.find({ 
      categories: { $in: categoryIds }, // note 'categories' matches Blog schema
      status: "published"
    })
      .populate("author", "name username")
      .populate("categories", "name") // populate array
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    console.error("Error fetching category blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
