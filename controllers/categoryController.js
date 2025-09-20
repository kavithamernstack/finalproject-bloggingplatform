import Category from '../models/Category.js';
import slugify from "slugify";

// List all categories
export const list = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      name: 1
    });
    res.json(categories);
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    res.status(500).json({
      message: "Failed to fetch categories"
    });
  }
};

// Create a new category with a slug
export const create = async (req, res) => {
  try {
    const {
      name
    } = req.body;
    if (!name) return res.status(400).json({
      message: "Name is required"
    });

    const category = new Category({
      name,
      slug: slugify(name, {
        lower: true,
        strict: true
      }),
    });
    const savedCategory = await category.save();
    res.json(savedCategory);
  } catch (err) {
    console.error("Failed to create category:", err);
    res.status(500).json({
      message: "Failed to create category"
    });
  }
};

// Update category
export const update = async (req, res) => {
  try {
    const {
      name
    } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id, {
      name,
      slug: slugify(name, {
        lower: true,
        strict: true
      })
    }, {
      new: true
    }
    );
    res.json(updated);
  } catch (err) {
    console.error("Failed to update category:", err);
    res.status(500).json({
      message: "Failed to update category"
    });
  }
};

// Delete category
export const remove = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({
      message: "Deleted"
    });
  } catch (err) {
    console.error("Failed to delete category:", err);
    res.status(500).json({
      message: "Failed to delete category"
    });
  }
};