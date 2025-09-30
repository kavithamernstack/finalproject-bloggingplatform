import Post from '../models/Post.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Safe JSON parse function
const safeJSONParse = (data, fallback) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    return fallback;
  }
};

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      return (
        process.env.DEFAULT_BANNER_URL ||
        "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg"
      );
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "post_banners",
      use_filename: true,
      unique_filename: true,
    });

    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    // Always fall back
    return (
      process.env.DEFAULT_BANNER_URL ||
      "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg"
    );
  }
};


// ----------------- CREATE POST -----------------
// ----------------- CREATE POST -----------------
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, tags = "[]", categories = "[]", status = "draft" } = req.body;

    let bannerUrl = null;

    if (req.file) {
      // Upload file to Cloudinary
      bannerUrl = await uploadToCloudinary(req.file);
      fs.unlinkSync(req.file.path); // remove temp file
    } else {
      // Assign default banner URL if no file uploaded
      bannerUrl = process.env.DEFAULT_BANNER_URL || "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg";
    }

    const post = new Post({
      title,
      content,
      excerpt,
      tags: safeJSONParse(tags, []),
      categories: safeJSONParse(categories, []),
      status,
      author: req.user._id,
      banner: bannerUrl, // always set
    });

    await post.save();

    // Create notification
    await Notification.create({
      user: req.user._id,
      type: post.status === "published" ? "post_published" : "post_draft",
      message: `Your post "${post.title}" has been ${post.status === "published" ? "published" : "saved as a draft"}.`,
      relatedPost: post._id,
    });

    res.json(post);
  } catch (err) {
    console.error("CreatePost Error:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};


// ----------------- UPLOAD EDITOR IMAGE -----------------

const uploadEditorImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const url = await uploadToCloudinary(req.file);
    fs.unlinkSync(req.file.path);
    res.json({ url });
  } catch (err) {
    console.error("Editor image upload error:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

// ----------------- LIST POSTS -----------------
const listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', tag, category, author } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const filter = { status: 'published' };
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (tag) filter.tags = tag;
    if (category) filter.categories = { $in: [category] };
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

    // Ensure each post has a banner
    const postsWithBanner = items.map(post => {
      if (!post.banner) {
        post.banner = process.env.DEFAULT_BANNER_URL || "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg";
      }
      return post;
    });

    res.json({ items: postsWithBanner, total, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("ListPosts Error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};


// ----------------- MY POSTS -----------------
const myPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 });

    // Ensure each post has a banner
    const postsWithBanner = posts.map(post => {
      if (!post.banner) {
        post.banner = process.env.DEFAULT_BANNER_URL || "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg";
      }
      return post;
    });

    res.json(postsWithBanner);
  } catch (err) {
    console.error("MyPosts Error:", err);
    res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

// ----------------- GET SINGLE POST -----------------
const getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { "metrics.views": 1 } },
      { new: true }
    )
      .populate('author', 'username name email')
      .populate('categories', 'name slug');

    if (!post) return res.status(404).json({ message: 'Not Found' });

    // Ensure banner is always set
    if (!post.banner) {
      post.banner = process.env.DEFAULT_BANNER_URL || "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg";
    }

    res.json(post);
  } catch (err) {
    console.error("GetPost Error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};


// ----------------- UPDATE POST -----------------
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.author) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorized to update this post" });

    // Update fields
    post.title = req.body.title || post.title;
    post.excerpt = req.body.excerpt || post.excerpt;
    post.content = req.body.content || post.content;
    post.tags = req.body.tags ? safeJSONParse(req.body.tags, post.tags) : post.tags;
    post.categories = req.body.categories ? safeJSONParse(req.body.categories, post.categories) : post.categories;
    post.status = req.body.status || post.status;

    // Handle banner
    if (req.file) {
      // Upload new banner
      const bannerUrl = await uploadToCloudinary(req.file);
      fs.unlinkSync(req.file.path);
      post.banner = bannerUrl;
    } else if (!post.banner) {
      // If banner is missing, use default
      post.banner = process.env.DEFAULT_BANNER_URL || "https://res.cloudinary.com/dpjhn8gha/image/upload/v1759210894/default_1_jlzzn0.jpg";
    }

    const updatedPost = await post.save();

    // Create notification
    await Notification.create({
      user: req.user._id,
      type: updatedPost.status === "published" ? "post_published" : "post_draft",
      message: `Your post "${updatedPost.title}" has been ${updatedPost.status === "published" ? "published" : "saved as a draft"}.`,
      relatedPost: updatedPost._id,
    });

    res.json(updatedPost);
  } catch (err) {
    console.error("UpdatePost Error:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};
// ----------------- LIKE POST -----------------
const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not Found' });

  const i = post.metrics.likes.findIndex(u => String(u) === String(req.user._id));
  if (i > -1) post.metrics.likes.splice(i, 1);
  else post.metrics.likes.push(req.user._id);

  await post.save();
  res.json({ likes: post.metrics.likes.length });
};

// ----------------- SHARE POST -----------------
const sharePost = async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'metrics.shares': 1 } },
    { new: true }
  );
  res.json({ shares: post.metrics.shares });
};

// ----------------- DELETE POST -----------------
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

// ----------------- UNPUBLISH POST -----------------
const unpublishPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.author) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorized to unpublish post" });

    post.status = "draft";
    await post.save();

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

// ✅ EXPORT
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
