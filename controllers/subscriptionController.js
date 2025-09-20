import Subscription from '../models/Subscription.js';
import Blog from '../models/Blog.js';
import CategorySubscription from '../models/CategorySubscription.js';

// 🔹 Toggle follow/unfollow a blogger
export const toggle = async (req, res) => {
  try {
    const following = req.params.userId;
    const follower = req.user._id;

    const exists = await Subscription.findOne({ follower, following });
    if (exists) {
      await exists.deleteOne();
      return res.json({ subscribed: false });
    }

    await Subscription.create({ follower, following });
    res.json({ subscribed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Check if current user is following another blogger
export const check = async (req, res) => {
  try {
    const following = req.params.userId;
    const follower = req.user._id;

    const exists = await Subscription.findOne({ follower, following });
    res.json({ subscribed: !!exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Fetch posts from followed bloggers (feed)
export const feed = async (req, res) => {
  try {
    const follows = await Subscription.find({ follower: req.user._id }).select('following');
    const followingIds = follows.map(f => f.following);

    const posts = await Blog.find({ author: { $in: followingIds }, status: 'published' })
      .populate('author', 'name username')
      .populate('categories', 'name') // populate array of categories
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 List all bloggers the user is subscribed to
export const bloggerSubs = async (req, res) => {
  try {
    const follows = await Subscription.find({ follower: req.user._id })
      .populate("following", "name username");
    res.json(follows.map(f => f.following));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 List all blogs from categories the user is subscribed to
export const categorySubs = async (req, res) => {
  try {
    const subs = await CategorySubscription.find({ user: req.user._id });
    const categoryIds = subs.map(s => s.category);

    if (!categoryIds.length) return res.json([]);

    const blogs = await Blog.find({
      categories: { $in: categoryIds }, // handle array
      status: 'published'
    })
      .populate("author", "name username")
      .populate("categories", "name") // populate array of categories
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    console.error("Error fetching category blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};
