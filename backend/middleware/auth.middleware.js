import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import dotenv from "dotenv"

dotenv.config()


export const protectRoute =async(req,res,next)=>{
    try{
        const accessToken = req.cookies.access_token
        if(!accessToken){
            return res.status(401).json({message:"Unauthorized - No access token provided"})
        }
        try{
            const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_KEY)
            const user = await User.findById(decoded.userId).select("-password")
            if(!user){
                return res.status(401).json({message:"Unauthorized - User not found"})
                
            }
            req.user = user
            next()
        }
        catch(err){
            if(err.name === "TokenExpiredError"){
                return res.status(401).json({message:"Unauthorized - Access token has expired"})
            }
            throw err
        }
    }
    catch(err){
        res.status(401).json({message:"Unauthorized - Invalid access token"})
        console.log("Error in protect route",err)
    }
}



export const adminRoute =async(req,res,next)=>{
    if(req.user && req.user.role === "admin"){
        next()
    }
    else{
        return res.status(403).json({message:"Forbidden - You are not an admin"})
    }
}

