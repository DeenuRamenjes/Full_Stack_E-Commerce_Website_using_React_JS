import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
    products: [],
    loading: false,
    setProducts: (products) => set({ products }),
    createProduct: async (productData) => {
        set({ loading: true });
        try {
            const res = await axios.post("/products", productData);
            set((prevState) => ({
                products: [...prevState.products, res.data.product],
                loading: false
            }));
            toast.success("Product created successfully");
        }
        catch (error) {
            console.log("Error creating product", error);
            toast.error(error.response?.data?.message || "Error creating product");
            set({ loading: false });
        }
    },

    updateProduct: async (id, productData) => {
        set({ loading: true });
        try {
            const res = await axios.put(`/products/${id}`, productData);
            set((prevState) => ({
                products: prevState.products.map((product) => 
                    product._id === id ? res.data.product : product
                ),
                loading: false
            }));
            toast.success("Product updated successfully");
        }
        catch (error) {
            console.log("Error updating product", error);
            toast.error(error.response?.data?.message || "Error updating product");
            set({ loading: false });
        }
    },

    deleteProduct: async (id) => {
        set({ loading: true });
        try {
            await axios.delete(`/products/${id}`);
            set((prevState) => ({
                products: prevState.products.filter((product) => product._id !== id),
                loading: false
            }));
            toast.success("Product deleted successfully");
        }
        catch (error) {
            console.log("Error deleting product", error);
            toast.error(error.response?.data?.message || "Error deleting product");
            set({ loading: false });
        }
    },

    fetchAllProducts: async () => {
        set({ loading: true });
        try {
            const res = await axios.get("/products");
            set({ products: res.data.products, loading: false });
        }
        catch (error) {
            console.log("Error fetching products", error);
            toast.error(error.response?.data?.message || "Error fetching products");
            set({ loading: false });
        }
    },

    toggleFeaturedProduct: async (productId) => {
        set({ loading: true });
        try {
            const res = await axios.patch(`/products/${productId}`);
            set((prevState) => ({
                products: prevState.products.map((product) => 
                    product._id === productId ? { ...product, isFeatured: !product.isFeatured } : product
                ),
                loading: false
            }));
        }
        catch (error) {
            console.log("Error updating product", error);
            toast.error(error.response?.data?.message || "Error updating product");
            set({ loading: false });
        }
    },

    fetchProductByCategory: async (category) => {
        set({ loading: true });
        try{
            const res = await axios.get(`/products/category/${category}`);
            set({ products: res.data.products, loading: false });
        }
        catch (error) {
            console.log("Error fetching products", error);
            toast.error(error.response?.data?.message || "Error fetching products");
            set({ loading: false });
        }
    },

    fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},

}));