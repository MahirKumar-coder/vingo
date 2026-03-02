import axios from 'axios';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';

function UserOrderCard({ data }) { 

  const navigate = useNavigate()
  const [selectedRating, setSelectedRating] = useState({})
  
  if (!data) return null;

  const order = data; 

  const getStatusBadge = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Preparing": "bg-blue-100 text-blue-800",
      "Out for Delivery": "bg-purple-100 text-purple-800",
      "Delivered": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleRating = async (itemId, rating) => {
    try {
      const result = await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true})
      setSelectedRating(prev => ({
        ...prev, [itemId]: rating
      }))
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <div>
           <span className="font-bold text-gray-700">Order #{order._id?.slice(-6).toUpperCase()}</span>
           <p className="text-xs text-gray-500">
             {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date N/A"}
           </p>
        </div>
        <div className="text-sm font-semibold text-gray-600">
          Total: ₹{order.totalAmount}
        </div>
      </div>

      {/* Shop-wise Status Section */}
      <div className="space-y-3">
        {order.shopOrders && order.shopOrders.map((shopOrder, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-md">
            
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-gray-800">
                {shopOrder.shop?.name || "Shop Name"}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(shopOrder.status)}`}>
                {shopOrder.status}
              </span>
            </div>

            <div className="space-y-3 pl-2 border-l-2 border-gray-300">
              {shopOrder.shopOrderItems.map((item, idx) => {
                // Item ka ID nikalne ke liye safety check
                const currentItemId = item.item?._id || item.item;

                return (
                  // 👇 FIX 1: Rating logic ab item loop ke ANDAR hai
                  <div key={idx} className="flex flex-col text-sm text-gray-600">
                    <div className='flex justify-between'>
                      <span className='font-medium'>{item.quantity} x {item.name}</span>
                      <span className='font-semibold'>₹{item.price}</span>
                    </div>
                    
                    {/* 👇 FIX 2: "Delivered" Capital D ke sath */}
                    {shopOrder.status === "Delivered" && (
                      <div className='flex space-x-1 mt-1 items-center'>
                        <span className='text-xs text-gray-400 mr-2'>Rate this item:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            // 👇 FIX 3: onClick event lagaya 
                            onClick={() => handleRating(currentItemId, star)}
                            className={`text-xl transition-colors duration-200 ${
                              selectedRating[currentItemId] >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        ))}

        <div className='flex justify-between items-center border-t pt-2'>
          <p className='font-semibold'>Total: ₹{data.totalAmount}</p>
          <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors' onClick={()=>navigate(`/track-order/${data._id}`)}>Track Order</button>
        </div>
      </div>

    </div>
  );
}

export default UserOrderCard;

// 5:47:03