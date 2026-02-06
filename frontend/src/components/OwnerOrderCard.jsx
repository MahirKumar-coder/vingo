import axios from 'axios';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { serverUrl } from '../App'; // 👈 Make sure to import serverUrl

function OwnerOrderCard({ data }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Safety Checks
  if (!userData) return <div className="p-2">Loading...</div>;
  if (!data || !data.shopOrders) return null;

  // 1. Apna Order Dhundo
  const myShopOrder = data.shopOrders.find((shopOrder) => {
    const ownerId = shopOrder.owner?._id || shopOrder.owner;
    return String(ownerId) === String(userData._id);
  });

  if (!myShopOrder) return null;

  // 2. Local State
  const [status, setStatus] = useState(myShopOrder.status);

  // 3. Update Function
  // 3. Update Function (Fixed URL & Method)
  const handleUpdateStatus = async (e) => {
    const newStatus = e.target.value;

    // 1. Optimistic UI Update (Turant UI change)
    setStatus(newStatus);

    // 2. Correct Shop ID logic
    // Shop object ho sakta hai ya string ID, dono handle karo:
    const shopId = myShopOrder.shop._id || myShopOrder.shop;

    try {
      // 👇 FIX: Method 'POST' kiya aur URL me ShopID lagaya
      await axios.post(
        `${serverUrl}/api/order/update-status/${data._id}/${shopId}`,
        { status: newStatus }, // Body me sirf status bhejo
        { withCredentials: true }
      );

      // Redux Update (Global State Update)
      dispatch(updateOrderStatus({
        orderId: data._id,
        shopId: shopId,
        status: newStatus
      }));

      console.log("✅ Status Updated via API");

    } catch (error) {
      console.log("Update failed:", error);
      // Agar fail ho jaye to wapas purana status set karo
      setStatus(myShopOrder.status);
      alert("Failed to update status");
    }
  };

  // Status Color Helper
  const getStatusColor = (st) => {
    if (st === 'Pending') return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    if (st === 'Preparing') return 'text-blue-600 border-blue-200 bg-blue-50';
    if (st === 'Out for Delivery') return 'text-purple-600 border-purple-200 bg-purple-50';
    if (st === 'Delivered') return 'text-green-600 border-green-200 bg-green-50';
    return 'text-gray-600 border-gray-200';
  }

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4 mb-4 border-l-4 border-blue-500'>
      <div className='flex justify-between border-b pb-2'>
        <div>
          <p className='font-semibold'>Order #{data._id.slice(-6)}</p>
          <p className='text-sm text-gray-500'>
            Customer: {data.user?.name || "N/A"}
          </p>
        </div>

        <div className='text-right'>
          {/* 👇 FIXED SELECT LOGIC */}
          <select
            value={status} // Value bind ki
            onChange={handleUpdateStatus} // Function simplify kiya
            className={`font-medium text-sm border rounded p-1 outline-none cursor-pointer ${getStatusColor(status)}`}
          >
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>

          <p className='text-xs text-gray-500 mt-1'>{data.paymentMethod}</p>
        </div>
      </div>

      <div className='space-y-2'>
        {myShopOrder.shopOrderItems.map((item, index) => (
          <div key={index} className='flex justify-between items-center bg-gray-50 p-2 rounded'>
            <div className='flex items-center gap-2'>
              {item.item?.image && (
                <img src={item.item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
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