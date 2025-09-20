// backend/seedCategories.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js"; // adjust path if needed
import slugify from "slugify";

dotenv.config();

const categories = [
  "Technology",
  "Health",
  "Lifestyle",
  "Finance",
  "Education",
  "Travel",
  "Food",
  "Sports"
];

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected!");

    // Remove all existing categories (optional)
    await Category.deleteMany({});
    console.log("Old categories cleared.");

    // Prepare documents with slugs
    const docs = categories.map(name => ({
      name,
      slug: slugify(name, { lower: true, strict: true }),
    }));

    // Insert categories
    await Category.insertMany(docs);
    console.log("Categories seeded successfully!");
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
