// import { Router } from 'express'
// import {list, create, update, remove} from '../controllers/categoryController.js'
// import { protect, adminOnly} from '../middleware/auth.js'

// const route = Router()

// route.get('/', list)
// route.post('/', protect, adminOnly, create)
// route.put('/:id', protect, adminOnly, update)
// route.delete('/:id', protect, adminOnly, remove)

// export default route
// backend/routes/category.js
// backend/routes/categoryRoutes.js
import express from "express";
import {
  list,
  create,
  update,
  remove
} from "../controllers/categoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public route to list all categories
router.get("/", list);

// Admin-only routes for category management
router.post("/", protect,  create);
router.put("/:id", protect,  update);
router.delete("/:id", protect, remove);


export default router;



