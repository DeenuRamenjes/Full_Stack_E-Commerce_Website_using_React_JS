import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import axios from '../lib/axios'
import { useUserStore } from './useUserStore'

export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subtotal: 0,
    loading: false,
    isCouponApplied: false,

    clearCart: () => {
        set({ cart: [], total: 0, subtotal: 0, coupon: null, isCouponApplied: false })
    },

    getCartItems: async () => {
        const user = useUserStore.getState().user
        if (!user) {
            set({ cart: [], total: 0, subtotal: 0 })
            return
        }
        set({ loading: true })
        try {
            const res = await axios.get('/cart')
            set({ cart: res.data.cartItems || [] })
            get().calculateTotal()
        }
        catch (error) {
            console.error('Error fetching cart:', error);
            set({ cart: [], total: 0, subtotal: 0 })
            if (error.response?.status === 401) {
                // Handle unauthorized error
                useUserStore.getState().logout();
                toast.error("Please login to view your cart");
            } else {
                toast.error(error.response?.data?.message || "Error fetching cart")
            }
        }
        finally {
            set({ loading: false })
        }
    },

    addToCart: async (product) => {
        const user = useUserStore.getState().user
        if (!user) {
            toast.error("Please login to add items to cart")
            return
        }
        set({ loading: true })
        try {
            await axios.post('/cart', { productId: product._id })
            toast.success('Product added to cart')
            // Fetch updated cart after adding item
            await get().getCartItems()
        }
        catch (error) {
            console.error('Error adding to cart:', error);
            if (error.response?.status === 401) {
                // Handle unauthorized error
                useUserStore.getState().logout();
                toast.error("Please login to add items to cart");
            } else {
                toast.error(error.response?.data?.message || "Error adding to cart")
            }
        }
        finally {
            set({ loading: false })
        }
    },

    calculateTotal: () => {
        const { cart, coupon } = get()
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        let total = subtotal
        if (coupon) {
            const discount = subtotal * coupon.discountPercentage / 100
            total = subtotal - discount
        }
        set({ total, subtotal })
    },

    removeFromCart: async (productId) => {
        try {
            await axios.delete('/cart', { data: { productId } })
            await get().getCartItems()
            toast.success('Product removed from cart')
        } catch (error) {
            console.error('Error removing from cart:', error);
            if (error.response?.status === 401) {
                // Handle unauthorized error
                useUserStore.getState().logout();
                toast.error("Please login to manage your cart");
            } else {
                toast.error(error.response?.data?.message || "Error removing from cart")
            }
        }
    },

    updateQuantity: async (productId, quantity) => {
        if(quantity === 0) {
            get().removeFromCart(productId)
            return
        }
        try {
            console.log('Making API call to update quantity:', { productId, quantity });
            await axios.put(`/cart/${productId}`, { quantity })
            await get().getCartItems()
        } catch (error) {
            console.error('Error updating quantity:', error);
            if (error.response?.status === 401) {
                // Handle unauthorized error
                useUserStore.getState().logout();
                toast.error("Please login to update cart quantity");
            } else {
                toast.error(error.response?.data?.message || "Error updating quantity")
            }
        }
    },

    getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotal();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},

    removeCoupon: () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotal();
        toast.success("Coupon removed successfully");
    }
}))

