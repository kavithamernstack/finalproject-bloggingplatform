import Post from "../models/Post.js";

// ✅ Get analytics summary for logged-in user
export const myStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count total, published, draft blogs
    const totalBlogs = await Post.countDocuments({ author: userId });
    const publishedBlogs = await Post.countDocuments({
      author: userId,
      status: "published",
    });
    const drafts = await Post.countDocuments({
      author: userId,
      status: "draft",
    });

    // Aggregate metrics: views, likes, shares, comments
    const metrics = await Post.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          views: { $sum: "$metrics.views" },
          shares: { $sum: "$metrics.shares" },
          comments: { $sum: "$metrics.comments" }, // assuming you store comments count in metrics
          likes: { $sum: { $size: "$metrics.likes" } }, // likes is an array
        },
      },
    ]);

    const stats = {
      totalBlogs,
      publishedBlogs,
      drafts,
      views: metrics[0]?.views || 0,
      likes: metrics[0]?.likes || 0,
      comments: metrics[0]?.comments || 0,
      shares: metrics[0]?.shares || 0,
    };

    res.json(stats);
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// ✅ List all user posts for graphs (optional)
export const summary = async (req, res) => {
  try {
    const userPosts = await Post.find({ author: req.user._id });
    const data = userPosts.map((p) => ({
      id: p._id,
      title: p.title,
      views: p.metrics.views,
      likes: p.metrics.likes.length,
      shares: p.metrics.shares,
      comments: p.metrics.comments,
    }));
    res.json(data);
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};
