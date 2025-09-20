import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from "fs"
import http from "http"
import { Server } from "socket.io"

import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import tagRoutes from './routes/tagRoutes.js'
import subscriptionRoutes from './routes/subscriptionRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import { notFound, errorHandler } from './middleware/error.js'

dotenv.config()
connectDB()

const app = express()

// Middlewares
const allowedOrigins = [
  "http://localhost:3000",
  "https://blogging-platform-kavimernstack.netlify.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true); // allow Postman, server-to-server
    if(allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("Not allowed by CORS"), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));

// Basic route
app.get('/', (req, res) => res.json({ status: 'ok' }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use("/api/categories", categoryRoutes)
app.use('/api/tags', tagRoutes)
app.use("/api/subscriptions", subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes)
app.use("/api/notifications", notificationRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath)

// ------------------- SOCKET.IO SETUP -------------------
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://blogging-platform-kavimernstack.netlify.app",
    methods: ["GET", "POST"],
  }
})

// Track online users
let onlineUsers = {}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Store user when they connect
  socket.on("user_connected", (userId) => {
    onlineUsers[userId] = socket.id
    console.log("Online users:", onlineUsers)
  })

  // Remove user when they disconnect
  socket.on("disconnect", () => {
    onlineUsers = Object.fromEntries(
      Object.entries(onlineUsers).filter(([_, val]) => val !== socket.id)
    )
    console.log("User disconnected:", socket.id)
  })
})

// Make io available in routes
app.set("io", io)

// ------------------- SERVER START -------------------
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server is running on ${PORT}`))
