import { Router } from 'express'
import { register, login, myAccount, requestReset, passwordReset } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const route = Router()

route.post('/register', register)
route.post('/login', login)
route.get('/myaccount', myAccount)
route.get('/profile', protect, myAccount)  
route.post('/request-reset',protect, requestReset)
route.post('/reset/:token', passwordReset)

export  default route