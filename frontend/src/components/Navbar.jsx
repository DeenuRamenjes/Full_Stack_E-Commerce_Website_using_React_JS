import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {ShoppingCart,Lock,LogOut,UserPlus,LogIn, Menu, X} from "lucide-react"
import { useUserStore } from '../stores/useUserStore'
import { useCartStore } from '../stores/useCartStore'
import { UserButton, useUser, useClerk } from '@clerk/clerk-react'
import { motion, AnimatePresence } from "framer-motion"

const Navbar = () => {

  const { user, logout } = useUserStore()
  const { user: clerkUser, signOut } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const isAdmin = user?.role === 'admin'
  const {cart}  = useCartStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isAuthenticated = clerkUser || user

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      // If user is logged in with Clerk, sign out from Clerk
      if (clerkUser) {
        await clerkSignOut()
      }
      // If user is logged in with regular auth, logout from store
      if (user) {
        await logout()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <header className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800'>
      <div className='container mx-auto py-3 px-4'>
        <div className='flex justify-between flex-wrap items-center'>
        <Link to="/" className='text-2xl font-bold text-emerald-400 items-center space-x-2 flex'>
            No-Limits
        </Link>
        <nav className='flex items-center flex-wrap gap-4'>
          <Link to={"/"} className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'>Home
          </Link>
              {user &&(
                <Link to={"/cart"} className='relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'>
                  <ShoppingCart className='inline-block mr-1 group-hover:text-emerald-400' size={20} />
                  <span className='hidden sm:inline'>Cart</span>
                  {cart.length > 0 && <span className='absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 0	text-xs group-hover:bg-emerald-400 transition duration-300 ease-in-out'>
                    {cart.length}
                  </span>}
                </Link>
              )}
              {isAdmin &&(
                <Link to={"/secret-dashboard"} className='bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center'>
                  <Lock className='mr-1 inline-block' size={18}/>
                  <span className='hidden sm:inline'>Dashboard</span>
                </Link>
              )}
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                   

                  {/* <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-10 h-10",
                        userButtonBox: "hover:bg-gray-100",
                        userButtonTrigger: "focus:shadow-none"
                      }
                    }}
                  /> */}
                  <button 
                    onClick={handleLogout} 
                    className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
                  >
                    <LogOut size={18}/>
                    <span className='hidden sm:inline ml-2'>Log out</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link to={"/signup"}	className='bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'>
									  <UserPlus className='mr-2' size={18} />
									Sign Up
                  </Link>
                  <Link	to={"/login"} className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4	rounded-md flex items-center transition duration-300 ease-in-out'> 
                    <LogIn className='mr-2' size={18} />
                    Login
                  </Link>
                </>
              )}
        </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/cart"
                    className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cart ({cart.length})
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-gray-900 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar