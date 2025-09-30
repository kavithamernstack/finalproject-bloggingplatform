import User from "../models/User.js";

// Get logged-in user's profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Basic fields
    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;

    // Avatar
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    // Social links
    user.links = user.links || {};
    Object.keys(req.body).forEach((key) => {
      const match = key.match(/^links\[(.+)\]$/);
      if (match) {
        const linkKey = match[1];
        user.links[linkKey] = req.body[key] || "";
      }
    });

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        avatar: user.avatar,
        links: user.links,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get any user by ID
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: "Not Found" });
  res.json(user);
};
