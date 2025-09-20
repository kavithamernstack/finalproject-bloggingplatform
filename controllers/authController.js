import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendEmail } from '../utils/email.js'

//generate token
const genToken = (id) => jwt.sign({id},
    process.env.JWT_SECRET,
    { expiresIn: '7d'}
)

//register token
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

    res.json({
      token: genToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || null,
      },
    });
  } catch (err) {
    console.error("Register error:", err);   // 👈 This will log full error in backend
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};


//login token
export const login = async (req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({email})
    if(!user || !(await user.matchPassword(password)))
        return res.status(400).json({message: "Invaild credentials"})
    res.json({token: genToken(user._id), user})
}

//myaccount token
export const myAccount = async (req, res) => {
    res.json({user: req.user})
}

// email request token
export const requestReset = async(req, res)=> {
    const {email} = req.body
    const user = await User.findOne({email})
    if(!user)
        return res.json({message:"If account exists, email sent"})
    user.resetToken = crypto.randomBytes(20).toString('hex')
    user.resetTokenExp = new Date(Date.now()+3600*1000)
    await user.save()
    const link = `${process.env.CLIENT_URL}/reset/${user.resetToken}`
    await sendEmail({ to: email, subject:'Password Reset', text:`Reset:${link}`})
    res.json({message:"Email Sent"})
}

//password reset token
export const passwordReset = async (req, res) => {
    const { token } = req.params
    const {password} = req.body
    const user = await User.findOne({ resetToken: token,
        resetTokenExp: { $gt: new Date()}
    })
    if(!user)
        return res.status(400).json({message:'Invaild or Expired token'})
    user.password = password
    user.resetToken = undefined
    user.resetTokenExp = undefined
    await user.save()
    res.json({message: 'Password Updated'})
}