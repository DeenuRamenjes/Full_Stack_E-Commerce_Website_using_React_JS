import React from 'react'
import ProductCard from './ProductCard'
import axios from '../lib/axios'
import toast from 'react-hot-toast';
import { useState,useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

const PeopleAlsoBrought = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get('/products/recommendations');
        // The response data has a products array
        setRecommendations(response.data.products || []);
      }
      catch (error) {
        console.error('Error fetching recommendations:', error);
        toast.error(error.response?.data?.message || "Error fetching recommendations");
        setRecommendations([]);
      }
      finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [])

  if (loading) {
    return <LoadingSpinner/>
  }
  
  return (
    <div className='mt-8' >
      <h3 className='text-2xl font-semibold text-emerald-400'>
        People Also Bought
      </h3>
      <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <p className="text-gray-400 col-span-full text-center">No recommendations available</p>
        )}
      </div>
    </div>
  )
}

export default PeopleAlsoBrought