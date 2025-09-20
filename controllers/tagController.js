import Tag from '../models/Tag.js';

// List tags
export const list = async (req, res) => {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
};

// Create tag
export const create = async (req, res) => {
  try {
    // Accept blogId from params OR body
    const blogId = req.params.blogId || req.body.blogId;
    const name = req.body.name;

    if (!name || !blogId) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // Create tag
    const tag = await Tag.create({ name, blog: blogId });
    res.json(tag);
  } catch (err) {
    console.error("Create tag error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Update tag
export const update = async (req, res) => {
  let { id } = req.params; // could be name or _id
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  // If id is not a valid ObjectId, search by name
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const tag = await Tag.findOneAndUpdate({ name: id }, { name }, { new: true });
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    return res.json(tag);
  }

  const tag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  res.json(tag);
};

// Delete tag
export const remove = async (req, res) => {
  let { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const tag = await Tag.findOneAndDelete({ name: id });
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    return res.json({ message: "Deleted" });
  }

  await Tag.findByIdAndDelete(id);
  res.json({ message: "Deleted" });
};
