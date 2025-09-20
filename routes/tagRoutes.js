import { Router } from 'express'
import {list, create, update, remove} from '../controllers/tagController.js'
import { protect, adminOnly} from '../middleware/auth.js'

const route = Router()

route.get('/', list)
route.post('/:blogId', protect, create);
route.put('/:id', protect, update);
route.delete('/:id', protect, remove);

export default route