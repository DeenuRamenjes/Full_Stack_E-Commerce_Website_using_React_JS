import User from "../models/user.model.js";
import { Webhook } from 'svix';
import { generateToken } from '../utils/token.js';
import { setCookies } from '../utils/cookies.js';

export const handleClerkWebhook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Get the headers
        const svix_id = req.headers["svix-id"];
        const svix_timestamp = req.headers["svix-timestamp"];
        const svix_signature = req.headers["svix-signature"];

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return res.status(400).json({ error: 'Error occurred -- no svix headers' });
        }

        // Get the body
        const payload = req.body;
        const body = JSON.stringify(payload);

        // Create a new Svix instance with your secret
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt;

        // Verify the payload with the headers
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (err) {
            console.error('Error verifying webhook:', err);
            return res.status(400).json({ error: 'Error occurred' });
        }

        // Handle the webhook
        const eventType = evt.type;
        console.log('Received webhook event:', eventType);

        if (eventType === 'user.created' || eventType === 'user.updated') {
            await syncUserWithClerk(req, res);
        }

        if (eventType === 'user.deleted') {
            const { id } = evt.data;
            try {
                await User.findOneAndDelete({ clerkId: id });
                console.log('Handled user deletion:', id);
                return res.status(200).json({ success: true });
            } catch (error) {
                console.error('Error handling user deletion:', error);
                return res.status(500).json({ error: 'Error handling user deletion' });
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Function to sync user data with Clerk
export const syncUserWithClerk = async (req, res) => {
    try {
        const { clerkUser } = req.body;
        console.log('Received Clerk user data:', clerkUser);

        if (!clerkUser || !clerkUser.id || !clerkUser.email) {
            console.error('Invalid Clerk user data:', clerkUser);
            return res.status(400).json({
                success: false,
                error: 'Invalid Clerk user data: missing required fields'
            });
        }

        // First try to find user by clerkId
        let user = await User.findOne({ clerkId: clerkUser.id });
        
        // If not found by clerkId, try to find by email
        if (!user) {
            user = await User.findOne({ email: clerkUser.email });
            if (user) {
                console.log('Found existing user by email, updating with Clerk data');
                // Update the existing user with Clerk data while preserving role
                const existingRole = user.role;
                user.clerkId = clerkUser.id;
                user.role = existingRole; // Preserve the existing role
            }
        }

        const isNewUser = !user;

        console.log('Existing user found:', !!user);

        try {
            if (!user) {
                user = new User({
                    clerkId: clerkUser.id,
                    email: clerkUser.email,
                    firstName: clerkUser.first_name,
                    lastName: clerkUser.last_name,
                    role: 'user', // Default role for new users
                    clerkData: {
                        id: clerkUser.id,
                        email: clerkUser.email,
                        first_name: clerkUser.first_name,
                        last_name: clerkUser.last_name,
                        image_url: clerkUser.image_url,
                        email_addresses: clerkUser.email_addresses,
                        primary_email_address_id: clerkUser.primary_email_address_id
                    }
                });
            } else {
                // Update existing user while preserving role
                const existingRole = user.role;
                user.email = clerkUser.email;
                user.firstName = clerkUser.first_name;
                user.lastName = clerkUser.last_name;
                user.role = existingRole; // Preserve the existing role
                user.clerkData = {
                    id: clerkUser.id,
                    email: clerkUser.email,
                    first_name: clerkUser.first_name,
                    last_name: clerkUser.last_name,
                    image_url: clerkUser.image_url,
                    email_addresses: clerkUser.email_addresses,
                    primary_email_address_id: clerkUser.primary_email_address_id
                };
            }

            await user.save();
            console.log(`${isNewUser ? 'Created' : 'Updated'} user:`, user.email, 'with role:', user.role);

            // Generate tokens and set cookies
            const { accessToken, refreshToken } = generateToken(user);
            setCookies(res, accessToken, refreshToken);

            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    clerkId: user.clerkId,
                    clerkData: user.clerkData
                }
            });
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            
            // If it's a duplicate key error, try to find and update the existing user
            if (saveError.code === 11000) {
                try {
                    const existingUser = await User.findOne({ email: clerkUser.email });
                    if (existingUser) {
                        // Update the existing user with Clerk data while preserving role
                        const existingRole = existingUser.role;
                        existingUser.clerkId = clerkUser.id;
                        existingUser.firstName = clerkUser.first_name;
                        existingUser.lastName = clerkUser.last_name;
                        existingUser.role = existingRole; // Preserve the existing role
                        existingUser.clerkData = {
                            id: clerkUser.id,
                            email: clerkUser.email,
                            first_name: clerkUser.first_name,
                            last_name: clerkUser.last_name,
                            image_url: clerkUser.image_url,
                            email_addresses: clerkUser.email_addresses,
                            primary_email_address_id: clerkUser.primary_email_address_id
                        };
                        
                        await existingUser.save();
                        console.log('Updated existing user with Clerk data:', existingUser.email, 'with role:', existingUser.role);

                        // Generate tokens and set cookies
                        const { accessToken, refreshToken } = generateToken(existingUser);
                        setCookies(res, accessToken, refreshToken);

                        return res.status(200).json({
                            success: true,
                            user: {
                                id: existingUser._id,
                                email: existingUser.email,
                                firstName: existingUser.firstName,
                                lastName: existingUser.lastName,
                                role: existingUser.role,
                                clerkId: existingUser.clerkId,
                                clerkData: existingUser.clerkData
                            }
                        });
                    }
                } catch (updateError) {
                    console.error('Error updating existing user:', updateError);
                    return res.status(500).json({
                        success: false,
                        error: 'Error updating existing user: ' + updateError.message
                    });
                }
            }
            
            return res.status(500).json({
                success: false,
                error: 'Error saving user data: ' + saveError.message
            });
        }
    } catch (error) {
        console.error('Error syncing user with Clerk:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}; 