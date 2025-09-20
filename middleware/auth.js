import jwt from 'jsonwebtoken'
import User from '../models/User.js'

//creating request and response for user
export const protect = async (req, res, next) => {
    let token
    if (req.headers.authorization
        && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else
        if (!token)
            return res.status(401).json({ message: 'Not Authorized' })
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select('-password')
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token invalid' })
    }
}

// creating req and res for admin
export const adminOnly = (req, res, next) => {
    if (req.user?.role === 'admin')
        return next()
    return res.status(403).json({ message: 'Forbidden' })
}