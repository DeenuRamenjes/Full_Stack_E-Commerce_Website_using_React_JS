import cloudinary from "../lib/cloudinary.js"
import Product from "../models/product.model.js"
import redis from "../lib/redis.js"

export const getAllProducts = async (req,res)=>{
    try{
        const products = await Product.find({})
        res.status(200).json({products})
    }
    catch(err){
        console.log("Internal Server Error",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const getFeaturedProducts = async (req,res)=>{
    try{
        let featuredProducts = await redis.get("featured_Products")
        if(featuredProducts){
            return res.status(200).json(JSON.parse(featuredProducts))
        }
        featuredProducts = await Product.find({isFeatured:true}).lean()
        if(!featuredProducts){
            return res.status(404).json({message:"No featured products found"})
        }
        await redis.set("featured_Products",JSON.stringify(featuredProducts))
        res.status(200).json({featuredProducts})
    }
    catch(err){
        console.log("Error in Featured Products",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url || "",
      category,
    });

    // Clear featured products cache
    await redis.del("featured_Products");

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error("Error in createProduct:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, isFeatured } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cloudinaryResponse = null;
    if (image && image !== product.image) {
      // Delete old image from cloudinary if it exists
      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
      cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
        image: cloudinaryResponse?.secure_url || product.image,
        category: category || product.category,
        isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
      },
      { new: true }
    );

    // Clear featured products cache
    await redis.del("featured_Products");

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (err) {
    console.error("Error in updateProduct:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteProduct = async (req,res)=>{
    try{
        const product = await Product.findById(req.params.id)
        if(!product){
            return res.status(404).json({message:"Product not found"})
        }
        
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0]
            try{
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log("Image deleted from cloudinary");
            }
            catch(err){
                console.log("Error in deleting image from cloudinary",err)
            }
        }

        await Product.findByIdAndDelete(req.params.id)
        
        // Clear featured products cache
        await redis.del("featured_Products");
        
        res.status(200).json({message:"Product deleted successfully"})
    }
    catch(err){
        console.log("Error in delete product",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const getRecommendedProducts = async (req,res)=>{
    try {
        const products = await Product.aggregate([
            {
                $sample:{size:3}
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description:1,
                    price:1,
                    image:1
                }
            }
        ])
        res.status(200).json({products})
    } 
    catch (err) {
        console.log("Error in get recommended products",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const getProductsByCategory = async (req,res)=>{
    const {category} = req.params
    try{
        const products = await Product.find({category})
        res.status(200).json({products})
    }
    catch(err){
        console.log("Error in get products by category",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const toggleFeaturedProduct = async (req,res)=>{
    try{
        const product = await Product.findById(req.params.id)
        if(product){
            product.isFeatured = !product.isFeatured
            const updatedProduct = await product.save()
            await redis.del("featured_Products")
            res.status(200).json({message:"Product featured status updated successfully",product:updatedProduct})
        }else{
            res.status(404).json({message:"Product not found"})
        }
    }
    catch(err){
        console.log("Error in toggle featured product",err)
        res.status(500).json({message:"Internal Server Error"})
    }
}