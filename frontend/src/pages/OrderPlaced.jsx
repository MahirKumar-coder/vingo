import React, { useEffect } from 'react'
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function OrderPlaced() {
    const navigate = useNavigate()
    
    // Automatically redirect to My Orders after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/my-orders');
        }, 3000);
        return () => clearTimeout(timer); // Cleanup timeout if component unmounts
    }, [navigate]);

    return (
        <div className='min-h-screen bg-[#fff9f6] flex flex-col justify-center items-center px-4 text-center relative overflow-hidden'>
            <FaCheckCircle className='text-green-500 text-6xl mb-4 animate-bounce' />
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Order Placed Successfully!</h1>
            <p className='text-gray-600 max-w-md mb-6'>
                Thank you for your purchase. Your delicious food is being prepared.
            </p>
            <p className='text-sm text-gray-500 mb-6 italic'>
                Redirecting to your orders in a few seconds...
            </p>
            <button 
                className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-6 py-3 rounded-lg text-lg font-medium transition cursor-pointer shadow-md' 
                onClick={() => navigate('/my-orders')}
            >
                View My Orders Now
            </button>
        </div>
    )
}

export default OrderPlaced