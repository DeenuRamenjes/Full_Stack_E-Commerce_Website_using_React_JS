import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
    const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
    const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY;

    if (!ACCESS_TOKEN_KEY || !REFRESH_TOKEN_KEY) {
        throw new Error('JWT secrets are not properly configured in environment variables');
    }

    const accessToken = jwt.sign(
        { 
            userId: user._id,
            email: user.email,
            clerkId: user.clerkId
        },
        ACCESS_TOKEN_KEY,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { 
            userId: user._id,
            email: user.email,
            clerkId: user.clerkId
        },
        REFRESH_TOKEN_KEY,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
}; 