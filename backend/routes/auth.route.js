import express from 'express';
import { 
    signup, 
    login, 
    logout, 
    refreshToken, 
    getProfile
} from '../controller/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', protectRoute, getProfile);
router.post('/logout', protectRoute, logout);
router.post('/refresh-token', refreshToken);

export default router; 