import express from 'express';
import { handleClerkWebhook, syncUserWithClerk } from '../controller/clerk.controller.js';

const router = express.Router();

// Clerk webhook endpoint
router.post('/webhook', handleClerkWebhook);

// Endpoint to sync user data
router.post('/sync', syncUserWithClerk);

export default router; 