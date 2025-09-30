import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {toggle, check, feed, bloggerSubs, categorySubs  } from '../controllers/subscriptionController.js'

const route = Router()


route.get('/check/:userId', protect, check)
route.get('/feed', protect, feed)
route.post('/:userId', protect, toggle)  // subscribe
route.delete('/:userId', protect, toggle) // unsubscribe
route.get("/bloggers", protect, bloggerSubs);
route.get("/categories", protect, categorySubs);

export default route