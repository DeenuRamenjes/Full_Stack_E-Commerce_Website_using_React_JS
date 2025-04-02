import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { useCartStore } from "./useCartStore";

let refreshPromise = null;

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}
		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data.user, loading: false });
			toast.success("Signup successful!");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},

	login: async ({ email, password }) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/login", { email, password });
			console.log("Login response:", res.data);
			set({ user: res.data.user, loading: false });
			// Fetch cart items after successful login
			useCartStore.getState().getCartItems();
			toast.success("Login successful!");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			// First try to get the profile
			const res = await axios.get("/auth/profile");
			console.log("Auth check response:", res.data);
			set({ user: res.data.user, checkingAuth: false });
			// Fetch cart items after successful auth check
			if (res.data.user) {
				useCartStore.getState().getCartItems();
			}
		} catch (error) {
			// Don't show error toast for 401 when checking auth
			// This is expected when user is not logged in
			if (error.response?.status !== 401) {
				console.error("Auth check error:", error);
				toast.error(error.response?.data?.message || "An error occurred");
			}
			set({ checkingAuth: false, user: null });
		}
	},

	logout: async () => {
		try {
			// Clear user state first to prevent any further API calls
			set({ user: null, checkingAuth: false });
			// Clear cart
			useCartStore.getState().clearCart();
			
			// Attempt to logout from server
			try {
				await axios.post("/auth/logout");
				toast.success("Logged out successfully!");
			} catch (error) {
				console.error("Server logout error:", error);
				// Even if server logout fails, we still want to clear local state
				toast.success("Logged out successfully!");
			}
			
			// Use setTimeout to ensure all state updates are complete
			setTimeout(() => {
				window.location.href = '/';
			}, 100);
		} catch (error) {
			console.error("Logout error:", error);
			// Even if there's an error, we should still clear the local state
			set({ user: null, checkingAuth: false });
			useCartStore.getState().clearCart();
			toast.success("Logged out successfully!");
			// Use setTimeout to ensure all state updates are complete
			setTimeout(() => {
				window.location.href = '/';
			}, 100);
		}
	},

	refreshToken: async () => {
		if(get().checkingAuth){
			return;
		}
		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({checkingAuth: false });
			return response.data;
		}
		catch (error) {
			set({user:null,checkingAuth: false });
			throw error
		}
	},

}));

axios.interceptors.response.use(
	(response) => response,
	async(error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			try {
				if(refreshPromise){
					await refreshPromise;
					return axios(originalRequest);
				}
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;
				return axios(originalRequest);
			}
			catch (refreshError) {
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
)
