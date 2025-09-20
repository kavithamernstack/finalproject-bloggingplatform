import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {listByPost, listMyComments, addComment, updateComment, deleteComment} from '../controllers/commentController.js'

const route = Router()

route.get('/post/:postId', listByPost)
route.get("/my", protect, listMyComments);
route.post('/', protect, addComment)
route.put('/:id', protect, updateComment)
route.delete('/:id', protect, deleteComment)

export default route