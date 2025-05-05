import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../lib/axios';
import { useUserStore } from '../stores/useUserStore';

export default function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();

  useEffect(() => {
    const syncUserData = async () => {
      if (clerkUser && isClerkLoaded) {
        try {
          // Get primary email
          const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
          
          if (!primaryEmail) {
            console.error('No primary email found in Clerk user');
            toast.error('No email found in your Google account');
            return;
          }

          // Log the Clerk user data
          console.log('Clerk User Data:', {
            id: clerkUser.id,
            email: primaryEmail,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          });

          const userData = {
            clerkUser: {
              id: clerkUser.id,
              email: primaryEmail,
              first_name: clerkUser.firstName,
              last_name: clerkUser.lastName,
              image_url: clerkUser.imageUrl,
              email_addresses: [{
                id: clerkUser.primaryEmailAddress?.id,
                email_address: primaryEmail,
                verification: { status: 'verified' }
              }],
              primary_email_address_id: clerkUser.primaryEmailAddress?.id
            }
          };

          console.log('Sending to backend:', userData);

          const response = await axios.post('/clerk/sync', userData, {
            withCredentials: true
          });

          if (response.data.success) {
            console.log('User data synced successfully:', response.data.user);
            // Update the user store with the synced user data
            setUser(response.data.user);
            toast.success('Successfully logged in!');
            
            // Get the redirect path from location state or default to '/'
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          } else {
            console.error('Sync failed:', response.data.error);
            toast.error(response.data.error || 'Failed to sync user data');
          }
        } catch (error) {
          console.error('Error syncing user data:', error);
          if (error.response) {
            console.error('Error response:', error.response.data);
            toast.error(error.response.data.error || 'Failed to sync user data');
          } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error('No response from server. Please try again.');
          } else {
            console.error('Error setting up request:', error.message);
            toast.error('Failed to sync user data. Please try again.');
          }
        }
      }
    };

    syncUserData();
  }, [clerkUser, isClerkLoaded, navigate, location, setUser]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // The actual sign-in will be handled by Clerk's SignInButton
      // This is just for loading state management
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // If we're on the login page and user is signed in, don't show anything
  if (window.location.pathname === '/login' && clerkUser) {
    return null;
  }

  return (
    <div className="w-full mb-5">
      <SignedOut>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SignInButton mode="modal" >
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 
                hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-gray-500 font-medium rounded-lg px-4 py-2.5 transition-all 
                duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </SignInButton>
        </motion.div>
      </SignedOut>
      <SignedIn>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-10 h-10",
                userButtonBox: "hover:bg-gray-100",
                userButtonTrigger: "focus:shadow-none"
              }
            }}
          />
        </motion.div>
      </SignedIn>
    </div>
  );
}