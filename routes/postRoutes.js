import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createPost,
  listPosts,
  myPosts,
  getPost,
  likePost,
  sharePost,
  uploadEditorImage,
  updatePost,
  deletePost, unpublishPost,
} from '../controllers/postController.js';

const route = Router();

route.get('/', listPosts);
route.get('/myposts', protect, myPosts);
route.get('/:id', getPost);

// Create post with banner upload
route.post('/', protect, upload.single('banner'), createPost);
route.post("/upload-editor", protect, upload.single("image"), uploadEditorImage);

// Update post with banner upload
route.put("/:id", protect, upload.single("banner"), updatePost);
route.delete("/:id", protect, deletePost);       // ✅ delete blog
route.put("/unpublish/:id", protect, unpublishPost);

// Like / share
route.post('/:id/like', protect, likePost);
route.post('/:id/share', sharePost);

export default route;
