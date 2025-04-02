import product from "../models/product.model.js";


export const getCartProducts = async (req,res)=>{
    try{
        if (!req.user.cartItems || req.user.cartItems.length === 0) {
            return res.json({cartItems: []})
        }

        const productIds = req.user.cartItems
            .filter(item => item && item.product)
            .map(item => item.product)

        const products = await product.find({_id: {$in: productIds}})
        
        const cartItems = products.map((product) => {
            const item = req.user.cartItems.find(cartItem => 
                cartItem && cartItem.product && cartItem.product.toString() === product._id.toString()
            )
            return {
                ...product.toJSON(),
                cartItemId: item._id,
                productId: product._id,
                quantity: item ? item.quantity : 1
            }
        })
        res.json({cartItems})
    }
    catch(err){
        console.error("Error in get cart products",err)
        res.status(500).json({message: "Error fetching cart items"})
    }
}


export const addToCart = async (req,res)=>{
    try{
        const {productId} = req.body
        if (!productId) {
            return res.status(400).json({message: "Product ID is required"})
        }

        const user = req.user
        const existingItem = user.cartItems.find(item => item.product && item.product.toString() === productId)
        
        if(existingItem){
            existingItem.quantity += 1
        }
        else{
            user.cartItems.push({
                product: productId,
                quantity: 1
            })
        }
        await user.save()
        res.json({message:"Item added to cart",cart:user.cartItems})
    }
    catch(err){
        console.log("Error in add to cart",err)
        res.status(500).json({message: "Error adding item to cart"})
    }
}


export const removeAllFromCart = async (req,res)=>{
    try{
        const {productId} = req.body
        const user = req.user
        if(!productId){
            user.cartItems = []
        }
        else{
            user.cartItems = user.cartItems.filter((item) => item.product && item.product.toString() !== productId)
        }
        await user.save()
        res.json({message:"Item removed from cart",cart:user.cartItems})
    }
    catch(err){
        console.log("Error in remove all from cart",err)
        res.status(500).json({message: "Error removing item from cart"})
    }
}


export const updateQuantity = async (req,res)=>{
    try{
        const {id} = req.params
        const {quantity} = req.body
        console.log('Received update quantity request:', { id, quantity });
        console.log('User cart items:', req.user.cartItems);
        
        const user = req.user
        const existingItem = user.cartItems.find((item) => item.product && item.product.toString() === id)
        console.log('Found existing item:', existingItem);
        
        if(existingItem){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter((item) => item.product && item.product.toString() !== id)
                await user.save()
                return res.json({message:"Item removed from cart",cart:user.cartItems})
            }
            existingItem.quantity = quantity
            await user.save()
            res.json({message:"Quantity updated",cart:user.cartItems})
        }
        else{
            console.log('Item not found in cart for productId:', id);
            res.status(404).json({message:"Item not found in cart"})
        }
    }
    catch(err){
        console.log("Error in update quantity",err)
        res.status(500).json({message: "Error updating quantity"})
    }
}