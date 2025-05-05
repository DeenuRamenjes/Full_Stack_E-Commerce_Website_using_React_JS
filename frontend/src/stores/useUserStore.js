import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { useCartStore } from "./useCartStore";

let refreshPromise = null;

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	// Check if user is authenticated
	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const res = await axios.get("/auth/profile");
			console.log("Auth check response:", res.data);
			set({ user: res.data.user, checkingAuth: false });
			if (res.data.user) {
				useCartStore.getState().getCartItems();
			}
		} catch (error) {
			console.error("Auth check error:", error);
			const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refresh_token='))?.split('=')[1];
			if (refreshToken) {
				try {
					const refreshRes = await axios.post('/auth/refresh-token');
					if (refreshRes.data.success) {
						const profileRes = await axios.get("/auth/profile");
						console.log("Profile after refresh:", profileRes.data);
						set({ user: profileRes.data.user, checkingAuth: false });
						if (profileRes.data.user) {
							useCartStore.getState().getCartItems();
						}
						return;
					}
				} catch (refreshError) {
					console.error("Refresh token error:", refreshError);
				}
			}
			localStorage.removeItem('token');
			document.cookie = 'access_token=; Max-Age=0; path=/;';
			document.cookie = 'refresh_token=; Max-Age=0; path=/;';
			set({ checkingAuth: false, user: null });
		}
	},

	// Set user data
	setUser: (user) => {
		set({ user });
		if (user) {
			useCartStore.getState().getCartItems();
		}
	},

	// Signup user
	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });
		try {
			if (password !== confirmPassword) {
				set({ loading: false });
				toast.error("Passwords do not match");
				return false;
			}

			console.log('Signup attempt with:', { name, email });
			const res = await axios.post("/auth/signup", { 
				name, 
				email, 
				password,
				authType: 'password' // Explicitly set auth type
			}, {
				withCredentials: true
			});

			console.log("Signup response:", res.data);
			
			if (res.data.success) {
				set({ user: res.data.user, loading: false });
				toast.success("Signup successful!");
				return true;
			} else {
				toast.error(res.data.message || "Signup failed");
				return false;
			}
		} catch (error) {
			console.error("Signup error:", error);
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
			return false;
		}
	},

	// Login user
	login: async ({ email, password, googleId }) => {
		set({ loading: true });
		try {
			console.log('Login attempt with:', { email, hasPassword: !!password, hasGoogleId: !!googleId });
			const res = await axios.post("/auth/login", { email, password, googleId }, {
				withCredentials: true
			});
			console.log("Login response:", res.data);
			
			if (res.data.success) {
				set({ user: res.data.user, loading: false });
				useCartStore.getState().getCartItems();
				toast.success("Login successful!");
				return true;
			} else {
				toast.error(res.data.message || "Login failed");
				return false;
			}
		} catch (error) {
			console.error("Login error:", error);
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
			return false;
		}
	},

	// Logout user
	logout: async () => {
		try {
			set({ user: null, checkingAuth: false });
			useCartStore.getState().clearCart();
			
			localStorage.removeItem('token');
			document.cookie = 'access_token=; Max-Age=0; path=/;';
			document.cookie = 'refresh_token=; Max-Age=0; path=/;';
			
			try {
				await axios.post("/auth/logout");
				toast.success("Logged out successfully!");
			} catch (error) {
				console.error("Server logout error:", error);
				toast.success("Logged out successfully!");
			}
			
			setTimeout(() => {
				window.location.href = '/login';
			}, 100);
		} catch (error) {
			console.error("Logout error:", error);
			localStorage.removeItem('token');
			document.cookie = 'access_token=; Max-Age=0; path=/;';
			document.cookie = 'refresh_token=; Max-Age=0; path=/;';
			set({ user: null, checkingAuth: false });
			useCartStore.getState().clearCart();
			toast.success("Logged out successfully!");
			setTimeout(() => {
				window.location.href = '/';
			}, 100);
		}
	},

	// Refresh token
	refreshToken: async () => {
		if(get().checkingAuth){
			return;
		}
		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			if (response.data.success) {
				const token = response.headers['set-cookie']?.find(cookie => cookie.includes('access_token='));
				if (token) {
					const accessToken = token.split(';')[0].split('=')[1];
					localStorage.setItem('token', accessToken);
				}
			}
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			console.error("Refresh token error:", error);
			localStorage.removeItem('token');
			document.cookie = 'access_token=; Max-Age=0; path=/;';
			document.cookie = 'refresh_token=; Max-Age=0; path=/;';
			set({ user: null, checkingAuth: false });
			throw error;
		}
	}
}));

// Add response interceptor
axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			
			try {
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}
				
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;
				
				return axios(originalRequest);
			} catch (refreshError) {
				console.error("Token refresh failed:", refreshError);
				localStorage.removeItem('token');
				document.cookie = 'access_token=; Max-Age=0; path=/;';
				document.cookie = 'refresh_token=; Max-Age=0; path=/;';
				
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		
		return Promise.reject(error);
	}
);
