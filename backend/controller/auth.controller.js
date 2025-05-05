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

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60)
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000 //15 in minutes
    }) 
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7 in days
    })   
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body
    try {
        const userExist = await User.findOne({ email })
        if (userExist) {
            return res.status(400).json({ message: "User already exists" })
        }
        const user = await User.create({ name, email, password })

        const { accessToken, refreshToken } = generateToken(user._id)
        await storeRefreshToken(user._id, refreshToken)
        setCookies(res, accessToken, refreshToken)

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: "User created successfully"
        })
    } catch (err) {
        console.log("Error in signup", err)
        res.status(500).json({ message: err.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login request data:', { email });

        const user = await User.findOne({ email });
        console.log('Found user:', user ? user.toObject() : 'No user found');

        if (!user) {
            console.log('User not found');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        console.log('Password validation result:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const { accessToken, refreshToken } = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        const { password: _, ...userWithoutPassword } = user.toObject();
        res.status(200).json({
            success: true,
            user: userWithoutPassword,
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY)
            await redis.del(`refresh_token:${decoded.userId}`)
        }
        res.clearCookie("access_token")
        res.clearCookie("refresh_token")
        res.status(200).json({ message: "Logged out successfully" })
    } catch (err) {
        console.log("Error in logout", err);
        res.status(500).json({ message: "Server Error", error: err.message })
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token provided"
            });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
            const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
            
            if (!storedToken || storedToken !== refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid refresh token"
                });
            }

            const accessToken = jwt.sign({
                userId: decoded.userId
            }, process.env.ACCESS_TOKEN_KEY, {
                expiresIn: "15m"
            });

            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                user,
                accessToken
            });

        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return res.status(401).json({
                success: false,
                message: "Token verification failed"
            });
        }
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while refreshing token"
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.access_token) {
            token = req.cookies.access_token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const tokenExpiration = decoded.exp * 1000;
            const timeUntilExpiration = tokenExpiration - Date.now();
            if (timeUntilExpiration < 5 * 60 * 1000) {
                const newAccessToken = jwt.sign({
                    userId: decoded.userId
                }, process.env.ACCESS_TOKEN_KEY, {
                    expiresIn: "15m"
                });

                const newRefreshToken = jwt.sign({
                    userId: decoded.userId
                }, process.env.REFRESH_TOKEN_KEY, {
                    expiresIn: "7d"
                });

                await redis.set(`refresh_token:${decoded.userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60);

                res.cookie("access_token", newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 15 * 60 * 1000,
                    path: "/"
                });

                res.cookie("refresh_token", newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    path: "/"
                });

                return res.status(200).json({
                    success: true,
                    user,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                });
            }

            return res.status(200).json({
                success: true,
                user
            });

        } catch (tokenError) {
            if (tokenError.name === "TokenExpiredError") {
                const refreshToken = req.cookies.refresh_token;
                if (!refreshToken) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired'
                    });
                }

                try {
                    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
                    const storedToken = await redis.get(`refresh_token:${decodedRefresh.userId}`);
                    
                    if (storedToken !== refreshToken) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid refresh token'
                        });
                    }

                    const newAccessToken = jwt.sign({
                        userId: decodedRefresh.userId
                    }, process.env.ACCESS_TOKEN_KEY, {
                        expiresIn: "15m"
                    });

                    const newRefreshToken = jwt.sign({
                        userId: decodedRefresh.userId
                    }, process.env.REFRESH_TOKEN_KEY, {
                        expiresIn: "7d"
                    });

                    await redis.set(`refresh_token:${decodedRefresh.userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60);

                    res.cookie("access_token", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 15 * 60 * 1000,
                        path: "/"
                    });

                    res.cookie("refresh_token", newRefreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 7 * 24 * 60 * 60 * 1000,
                        path: "/"
                    });

                    const user = await User.findById(decodedRefresh.userId).select('-password');
                    
                    if (!user) {
                        return res.status(401).json({
                            success: false,
                            message: 'User not found'
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        user,
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken
                    });
                } catch (refreshError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid refresh token'
                    });
                }
            }
            throw tokenError;
        }
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};