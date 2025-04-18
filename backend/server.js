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
import path from "path"
import cors from "cors"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const __dirname = path.resolve()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))

app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.options('*', (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.sendStatus(200)
})

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/analytics", analyticsRoutes)

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

app.listen(PORT, () => {
    console.log('====================================')
    console.log(`Server is running on ${PORT}`)
    console.log('====================================')
    connectDB()
})