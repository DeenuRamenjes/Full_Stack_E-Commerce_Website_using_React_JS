import express from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import { connectDB } from "./lib/db.js"
import cookieParser from "cookie-parser"
import couponRoutes from "./routes/coupon.route.js"
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoutes from "./routes/analytics.route.js"
import clerkRoutes from "./routes/clerk.route.js"
import path from "path"
import cors from "cors"

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const PORT = process.env.PORT || 5000

// Get current directory
const __dirname = path.resolve()

// Log environment
console.log('Environment:', process.env.NODE_ENV || 'development')
console.log('CORS Origin:', process.env.CORS_ORIGIN || 'http://localhost:5173')

// Configure CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
}))

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// CORS preflight handler
app.options('*', (req, res) => {
    res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:5173")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    res.header("Access-Control-Allow-Credentials", "true")
    res.sendStatus(200)
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/clerk", clerkRoutes)

// Production static file serving
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "frontend/dist"), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript')
            } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css')
            } else if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html')
            }
        }
    }))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "frontend/dist/index.html"))
    })
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    })
})

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB()
        
        // Start listening
        app.listen(PORT, () => {
            console.log('====================================')
            console.log(`Server is running on port ${PORT}`)
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
            console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
            console.log('====================================')
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()