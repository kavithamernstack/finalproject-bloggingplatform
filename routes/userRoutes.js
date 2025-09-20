// backend/routes/userRoutes.js
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getProfile, updateProfile, getUser } from "../controllers/userController.js";
import { upload } from "../middleware/upload.js";

const router = Router(); // ✅ Create router instance

// Get logged-in user's profile
router.get("/myprofile", protect, getProfile);

// Update logged-in user's profile (with avatar upload)
router.put("/updateprofile", protect, upload.single("avatar"), updateProfile);


// Get any user by ID (no auth required)
router.get("/:id", getUser);

export default router;
