import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadPath = path.join(__dirname, "../uploads");

// Ensure "uploads" folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage: store temporarily on disk before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter: only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only image files are allowed (png, jpg, jpeg, webp)"
      )
    );
  }
};

// Export multer instance
export const upload = multer({
  storage, // use diskStorage for temporary files
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
