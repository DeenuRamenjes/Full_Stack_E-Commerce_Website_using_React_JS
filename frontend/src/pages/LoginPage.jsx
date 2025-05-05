import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore.js";
import GoogleLogin from "../components/GoogleLogin.jsx";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login, loading } = useUserStore();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!email || !password) {
			console.error("Both email and password are required.");
			return;
		}
		login({ email, password });
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>Login to your account</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<GoogleLogin />
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-600"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
								</div>
							</div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-300 mt-4'>
								Email address
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='email'
									type='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
									focus:border-emerald-500 sm:text-sm'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-300'>
								Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='password'
									type='password'
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
									focus:border-emerald-500 sm:text-sm'
									placeholder='••••••••'
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="text-sm">
								<Link to="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
									Don't have an account? Sign up
								</Link>
							</div>
						</div>

						<button
							type='submit'
							className='w-full flex justify-center py-2 px-4 border border-transparent 
							rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
							hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
							focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
									Loading...
								</>
							) : (
								<>
									<LogIn className='mr-2 h-5 w-5' aria-hidden='true' />
									Sign in
								</>
							)}
						</button>
					</form>
				</div>
			</motion.div>
		</div>
	);
};

export default LoginPage;
