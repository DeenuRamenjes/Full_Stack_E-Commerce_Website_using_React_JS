import React from 'react'
import CategoryItem from '../components/CategoryItem';
import { useProductStore } from '../stores/useProductStore';
import FeaturedProducts from '../components/FeaturedProducts';
import { useEffect } from 'react';

const categories = [
	{ href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
	{ href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
	{ href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
	{ href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
	{ href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
	{ href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
	{ href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];

const HomePage = () => {
  const {fetchFeaturedProducts,products,loading} = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return (
    <div className='min-h-screen relative text-white overflow-hidden'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <h1 className='text-5xl font-bold text-emerald-400 mb-4 sm:text-6xl text-center'>
          Explore Our Collection
        </h1>
        <p className='text-xl text-center text-gray-300 mb-12'>
          Discover the latest fashion trends with No-Limits
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {categories.map((category) => (
            <CategoryItem key={category.name} category={category} />
          ))}
        </div>
        {!loading && <FeaturedProducts featuredProducts={products} />}
      </div>
    </div>
  )
}

export default HomePage