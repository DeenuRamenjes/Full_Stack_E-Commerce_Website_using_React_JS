import mongoose from "mongoose";
import dotenv from "dotenv"


dotenv.config()


export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${connect.connection.host}`)
    }
    catch (err) {
        console.error("Error connecting to MongoDB",err);
        process.exit(1)
    }
}