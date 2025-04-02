import User from "../models/user.model.js";
import jwt from "jsonwebtoken"
import redis from "../lib/redis.js"


const generateToken = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_KEY,
        { expiresIn: "15m" }
    )
    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_KEY,
        { expiresIn: "7d" }
    )
    return { accessToken, refreshToken }
}

const storeRefreshToken=async(userId,refreshToken)=>{
    await redis.set(`refresh_token:${userId}`,refreshToken,"EX",7*24*60*60)
}

const setCookies=(res,accessToken,refreshToken)=>{
    res.cookie("access_token",accessToken,{
        httpOnly:true, //prevent XSSS attacks , cross site scripting attacks
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",  //prevent CSRF attcacks,Cross site request forgery
        maxAge:15*60*1000 //15 in minutes
    }) 
    res.cookie("refresh_token",refreshToken,{
        httpOnly:true, //prevent XSSS attacks , cross site scripting attacks
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",  //prevent CSRF attcacks,Cross site request forgery
        maxAge:7*24*60*60*1000 //7 in days
    })   
}



export const signup = async (req,res)=>{

    const{name,email,password}=req.body
    try{
        const userExist=await User.findOne({email})
    if(userExist){
        return res.status(400).json({message:"User already exist"})
    }
    const user=await User.create({name,email,password})


    const {accessToken,refreshToken}=generateToken(user._id)
    await storeRefreshToken(user._id,refreshToken)

    setCookies(res,accessToken,refreshToken)


    res.status(201).json({user:{
        _id:user._id,
        name:user.name,
        email:user.email,
        role:user.role
    }, message:" created scuccessfully"})
    }
    catch(err){
        console.log("Error in signup",err)
        res.status(500).json({message:err.message})
    }   
}


export const login = async (req,res)=>{
    try{
        const {email,password}=req.body
        const user=await User.findOne({email})
        if(user && (await user.comparePassword(password))){
            const {accessToken,refreshToken}=generateToken(user._id)
            await storeRefreshToken(user._id,refreshToken)
            setCookies(res,accessToken,refreshToken)
            res.status(200).json({user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }})
        }
        else{
            return res.status(400).json({message:"Invalid email or password"})
        }
    }
    catch(err){
        console.log("Error in login",err);
        res.status(500).json({message:err.message})
    }
}


export const logout = async (req,res)=>{
    try{
        const refreshToken=req.cookies.refresh_token
        if(refreshToken){
            const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_KEY)
            await redis.del(`refresh_token:${decoded.userId}`)

        }
        res.clearCookie("access_token")
        res.clearCookie("refresh_token")
        res.status(200).json({message:"Logged out successfully"})
    }
    catch(err){
        console.log("Error in logout",err);
        res.status(500).json({message:"Server Error",error:err.message})
    }
}


export const refreshToken = async (req,res)=>{
    try{
        const refreshToken=req.cookies.refresh_token
        if(!refreshToken){
            return res.status(401).json({message:"No refresh token provided"})
        }
        const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_KEY)
        const storedToken =await redis.get(`refresh_token:${decoded.userId}`)
        if(storedToken!==refreshToken){
            return res.status(401).json({message:"Invalid Refresh token"})
        }
        const accessToken=jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_KEY,{expiresIn:"15m"})
        res.cookie("access_token",accessToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"strict",
            maxAge:15*60*1000,
        })
        res.json({message:"Token refreshed successfully"})
    }
    catch(err){
        console.log("Error in refresh token",err);
        res.status(500).json({message:"Server Error",error:err.message})
    }
}


export const getProfile = async (req,res)=>{
    try{
        res.json({
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        })
    }
    catch(err){
        console.log("Error in get profile",err);
        res.status(500).json({message:"Server Error",error:err.message})
    }
}