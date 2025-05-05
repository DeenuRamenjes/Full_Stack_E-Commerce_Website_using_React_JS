import jwt from "jsonwebtoken"
import User  from "../models/user.model.js"
import dotenv from "dotenv"
import redis from "../lib/redis.js"

dotenv.config()

export const protectRoute = async (req, res, next) => {
    try {
        // Get token from Authorization header or cookies
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.access_token) {
            token = req.cookies.access_token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
            
            // Get user from database
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not found'
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                // Only allow refresh on specific routes
                if (req.path === '/auth/refresh-token') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired'
                    });
                }

                // Try to refresh token if we have a refresh token
                const refreshToken = req.cookies.refresh_token;
                if (!refreshToken) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - Token has expired'
                    });
                }

                try {
                    // Verify refresh token
                    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
                    const storedToken = await redis.get(`refresh_token:${decodedRefresh.userId}`);
                    
                    if (storedToken !== refreshToken) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid refresh token'
                        });
                    }

                    // Generate new tokens
                    const newAccessToken = jwt.sign({
                        userId: decodedRefresh.userId
                    }, process.env.ACCESS_TOKEN_KEY, {
                        expiresIn: "15m"
                    });

                    // Get user data
                    const user = await User.findById(decodedRefresh.userId).select('-password');
                    
                    if (!user) {
                        return res.status(401).json({
                            success: false,
                            message: 'User not found'
                        });
                    }

                    // Add user to request and continue
                    req.user = user;
                    next();
                } catch (refreshError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid refresh token'
                    });
                }
            }
            throw err;
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Authentication failed'
        });
    }
};

export const adminRoute = async (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Forbidden - Admin access required'
        });
    }
}

