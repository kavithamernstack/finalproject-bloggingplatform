import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { myStats, summary } from "../controllers/analyticsController.js";

const router = Router();

// ✅ For MyAccount overview
router.get("/mystats", protect, myStats);

// ✅ For charts / graph data
router.get("/summary", protect, summary);

export default router;
