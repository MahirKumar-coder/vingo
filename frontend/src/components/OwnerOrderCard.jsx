import React, { useState } from 'react'; // 👈 useState import kiya
import { useSelector } from 'react-redux';

function OwnerOrderCard({ data }) {
  const { userData } = useSelector((state) => state.user);

  // Safety Checks
  if (!userData) return <div className="p-2">Loading...</div>;
  if (!data || !data.shopOrders) return null;

  // 1. Apna Order Dhundo
  const myShopOrder = data.shopOrders.find((shopOrder) => {
      const ownerId = shopOrder.owner?._id || shopOrder.owner;
      return String(ownerId) === String(userData._id);
  });

  if (!myShopOrder) return null;

  // 2. 👇 Status ke liye Local State banaya
  // Initial value database se aayegi
  const [status, setStatus] = useState(myShopOrder.status);

  // 3. 👇 Change Handle karne ka function
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    // TODO: Yahan API call lagana padega database update karne ke liye
    console.log("New Status Selected:", newStatus, "for Order ID:", data._id);
  };

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4 mb-4 border-l-4 border-blue-500'>
      <div className='flex justify-between border-b pb-2'>
        <div>
          <p className='font-semibold'>Order #{data._id.slice(-6)}</p>
          <p className='text-sm text-gray-500'>
            Customer: {data.user?.name || "N/A"}
          </p>
        </div>
        
        {/* 👇 YAHAN BADLAV KIYA HAI: SELECT TAG */}
        <div className='text-right'>
          <select 
            value={status} 
            onChange={handleStatusChange}
            className={`font-medium text-sm border rounded p-1 outline-none cursor-pointer
              ${status === 'Pending' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' : ''}
              ${status === 'Preparing' ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}
              ${status === 'Out for Delivery' ? 'text-green-600 border-green-200 bg-green-50' : ''}
            `}
          >
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Out for Delivery">Out of Delivery</option>
          </select>
          
          <p className='text-xs text-gray-500 mt-1'>{data.paymentMethod}</p>
        </div>
      </div>

      <div className='space-y-2'>
        {myShopOrder.shopOrderItems.map((item, index) => (
          <div key={index} className='flex justify-between items-center bg-gray-50 p-2 rounded'>
            <div className='flex items-center gap-2'>
               {item.item?.image && (
                 <img src={item.item.image} alt={item.name} className="w-10 h-10 object-cover rounded"/>
               )}
               <div>
                  <p className='font-medium text-sm'>{item.name}</p>
                  <p className='text-xs text-gray-500'>Qty: {item.quantity}</p>
               </div>
            </div>
            <p className='font-semibold'>₹{item.price * item.quantity}</p>
          </div>
        ))}
      </div>
      
      <div className='flex justify-between items-center pt-2 border-t'>
          <p className='font-bold'>Subtotal: ₹{myShopOrder.subtotal}</p>
      </div>
    </div>
  );
}

export default OwnerOrderCard;