import Post from '../models/Post.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js'; // ⚡ Added import

// Safe JSON parse function
const safeJSONParse = (data, fallback) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    return fallback;
  }
};

// Creating post
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, tags = "[]", categories = "[]", status = "draft" } = req.body;

    const post = new Post({
      title,
      content,
      excerpt,
      tags: safeJSONParse(tags, []),
      categories: safeJSONParse(categories, []),
      status,
      author: req.user._id,
      banner: req.file?.filename ? `/uploads/${req.file.filename}` : null,
    });

    await post.save();

    // ⚡ Add notification for published/draft
    if (post.status === "published") {
      await Notification.create({
        user: req.user._id,
        type: "post_published",
        message: `Your post "${post.title}" has been published!`,
        relatedPost: post._id,
      });
    } else {
      await Notification.create({
        user: req.user._id,
        type: "post_draft",
        message: `Your post "${post.title}" is saved as a draft.`,
        relatedPost: post._id,
      });
    }

    res.json(post);
  } catch (err) {
    console.error("CreatePost Error:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

// Upload image for editor only
const uploadEditorImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: `/uploads/${req.file.filename}` });
};

// Listing posts
const listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', tag, category, author } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const filter = { status: 'published' };
  
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (tag) filter.tags = tag;
    if (category) {
      try {
        filter.categories = { $in: [new mongoose.Types.ObjectId(category)] };
      } catch (err) {
        console.error("Invalid category id:", category);
      }
    }
    if (author) filter.author = author;

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username email')
        .populate('categories', 'name slug')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter),
    ]);

    res.json({ items, total, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("ListPosts Error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// Listing my posts
const myPosts = async (req, res) => {
  const posts = await Post.find({ author: req.user._id })
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 });
  res.json(posts);
};

// Get single post
const getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { "metrics.views": 1 } },
      { new: true }
    )
    .populate('author', 'username email')
    .populate('categories', 'name slug');

    if (!post) return res.status(404).json({ message: 'Not Found' });

    res.json(post);
  } catch (err) {
    console.error("GetPost Error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    post.title = req.body.title || post.title;
    post.excerpt = req.body.excerpt || post.excerpt;
    post.content = req.body.content || post.content;
    post.tags = req.body.tags ? safeJSONParse(req.body.tags, post.tags) : post.tags;
    post.categories = req.body.categories ? safeJSONParse(req.body.categories, post.categories) : post.categories;
    post.status = req.body.status || post.status;

    if (req.file?.filename) {
      post.banner = `/uploads/${req.file.filename}`;
    }

    const updatedPost = await post.save();

    // ⚡ Add notification for publish/unpublish change
    if (updatedPost.status === "published") {
      await Notification.create({
        user: req.user._id,
        type: "post_published",
        message: `Your post "${updatedPost.title}" has been published!`,
        relatedPost: updatedPost._id,
      });
    } else if (updatedPost.status === "draft") {
      await Notification.create({
        user: req.user._id,
        type: "post_draft",
        message: `Your post "${updatedPost.title}" is now a draft.`,
        relatedPost: updatedPost._id,
      });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("UpdatePost Error:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

// Like post
const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not Found' });

  const i = post.metrics.likes.findIndex(u => String(u) === String(req.user._id));
  if (i > -1) post.metrics.likes.splice(i, 1);
  else post.metrics.likes.push(req.user._id);

  await post.save();
  res.json({ likes: post.metrics.likes.length });
};

// Share post
const sharePost = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'metrics.shares': 1 } },
    { new: true }
  );
  res.json({ shares: post.metrics.shares });
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!req.user || String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DeletePost Error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// Unpublish a post
const unpublishPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.author) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorized to unpublish this post" });

    post.status = "draft";
    await post.save();

    // ⚡ Add notification for unpublish
    await Notification.create({
      user: req.user._id,
      type: "post_draft",
      message: `Your post "${post.title}" has been moved to draft.`,
      relatedPost: post._id,
    });

    res.json(post);
  } catch (err) {
    console.error("UnpublishPost Error:", err);
    res.status(500).json({ message: "Failed to unpublish post" });
  }
};

// ✅ Export all functions
export {
  createPost,
  uploadEditorImage,
  listPosts,
  myPosts,
  getPost,
  updatePost,
  likePost,
  sharePost,
  deletePost,
  unpublishPost
};
