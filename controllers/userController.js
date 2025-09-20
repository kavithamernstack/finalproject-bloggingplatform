import User from "../models/User.js";

// getting user profile
export const getProfile = async (req, res) => {
  res.json(req.user)
}

//updaing the user profie
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;

    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`; // ✅ store correct path
    }

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        avatar: user.avatar, // ✅ send back correct path
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// getting the user details
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')
  if (!user)
    return res.status(404).json({ message: "Not Found" })
  res.json(user)
}