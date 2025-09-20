// backend/seedCategories.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";
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

    for (const name of categories) {
      const slug = slugify(name, { lower: true, strict: true });
      const exists = await Category.findOne({ slug });
      if (!exists) {
        await Category.create({ name, slug });
        console.log(`✅ Added: ${name}`);
      } else {
        console.log(`ℹ️ Skipped (already exists): ${name}`);
      }
    }

    console.log("Seeding completed!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
