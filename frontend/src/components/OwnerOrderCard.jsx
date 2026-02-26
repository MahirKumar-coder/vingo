import axios from 'axios';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { serverUrl } from '../App';

function OwnerOrderCard({ data }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // 1. Data Calculate karo
  const safeShopOrders = data?.shopOrders || [];
  const myShopOrder = safeShopOrders.find((shopOrder) => {
    const ownerId = shopOrder.owner?._id || shopOrder.owner;
    return String(ownerId) === String(userData?._id);
  });

  // 2. State Define karo
  const [status, setStatus] = useState(myShopOrder?.status || 'Pending');
  const [assignedBoy, setAssignedBoy] = useState(myShopOrder?.assignedDeliveryBoy || null);
  const [availableBoys, setAvailableBoys] = useState([]);

  // 3. Safety Checks
  if (!userData) return <div className="p-2 text-gray-500">Loading User...</div>;
  if (!data || !myShopOrder) return null; 

  // 4. Functions
  const handleUpdateStatus = async (e) => {
    const newStatus = e.target.value;
    const oldStatus = status;

    setStatus(newStatus); // Optimistic UI Update
    const shopId = myShopOrder.shop._id || myShopOrder.shop;

    try {
      const response = await axios.post(
        `${serverUrl}/api/order/update-status/${data._id}/${shopId}`,
        { status: newStatus },
        { withCredentials: true }
      );

      dispatch(updateOrderStatus({
        orderId: data._id,
        shopId: shopId,
        status: newStatus
      }));

      if (response.data.success) {
        if (response.data.assignedDeliveryBoy) {
          setAssignedBoy(response.data.assignedDeliveryBoy);
        }
        if (response.data.availableBoys) {
          setAvailableBoys(response.data.availableBoys);
        }
      }
    } catch (error) {
      console.error("Update failed:", error);
      setStatus(oldStatus);
      alert("Failed to update status. Please try again.");
    }
  };

  const getStatusColor = (st) => {
    if (st === 'Pending') return 'text-yellow-700 border-yellow-300 bg-yellow-50';
    if (st === 'Preparing') return 'text-blue-700 border-blue-300 bg-blue-50';
    if (st === 'Out for Delivery') return 'text-purple-700 border-purple-300 bg-purple-50';
    if (st === 'Delivered') return 'text-green-700 border-green-300 bg-green-50';
    return 'text-gray-700 border-gray-300 bg-gray-50';
  }

  // 5. UI Render
  return (
    <div className='bg-white rounded-xl shadow-md p-5 space-y-5 mb-5 border border-gray-100 hover:shadow-lg transition-shadow'>
      
      {/* HEADER: Order ID & Status Dropdown */}
      <div className='flex justify-between items-start border-b pb-4'>
        <div>
          <p className='text-lg font-bold text-gray-800'>Order <span className='text-[#ff4d2d]'>#{data._id.slice(-6).toUpperCase()}</span></p>
          <p className='text-xs text-gray-400 mt-1'>Placed on: {new Date(data.createdAt).toLocaleString()}</p>
        </div>

        <select
          value={status}
          onChange={handleUpdateStatus}
          className={`font-semibold text-sm border-2 rounded-lg p-2 outline-none cursor-pointer transition-colors ${getStatusColor(status)}`}
        >
          <option value="Pending">Pending</option>
          <option value="Preparing">Preparing</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* CUSTOMER DETAILS BOX (NEW UI) */}
      <div className='bg-gray-50 p-4 rounded-xl border border-gray-200'>
        <h3 className='text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b pb-2'>Customer Details</h3>
        <div className='space-y-2 text-sm text-gray-600'>
          <p className='flex items-center gap-2'><span className='text-lg'>👤</span> <span className='font-semibold text-gray-800'>{data.user?.fullName || "Guest User"}</span></p>
          <p className='flex items-center gap-2'><span className='text-lg'>📞</span> {data.user?.mobile || "No Mobile Number"}</p>
          <p className='flex items-center gap-2'><span className='text-lg'>📧</span> {data.user?.email || "No Email ID"}</p>
          <p className='flex items-start gap-2 mt-2'>
            <span className='text-lg'>📍</span> 
            <span className='leading-snug'>{data.deliveryAddress?.text || "No Address Provided"}</span>
          </p>
        </div>
        
        {/* PAYMENT METHOD BADGE */}
        <div className='mt-3 pt-3 border-t border-gray-200 flex items-center gap-2'>
          <span className='text-sm font-bold text-gray-700'>Payment:</span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
            data.paymentMethod === 'online' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
          }`}>
            {data.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Paid'}
          </span>
        </div>
      </div>

      {/* DELIVERY DETAILS BOX */}
      {status === 'Out for Delivery' && (
        <div className='p-4 border rounded-xl bg-orange-50 text-sm shadow-inner'>
          <p className="font-bold text-orange-800 mb-3 flex items-center gap-2">🚚 Delivery Details</p>

          {assignedBoy || myShopOrder?.assignedDeliveryBoy ? (
            <div className="bg-white p-3 rounded-lg shadow-sm border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">Assigned To:</p>
              <p className="font-bold text-gray-800 flex items-center gap-2">👤 {(assignedBoy || myShopOrder.assignedDeliveryBoy).fullName}</p>
              <p className="text-gray-600 flex items-center gap-2 mt-1">📞 {(assignedBoy || myShopOrder.assignedDeliveryBoy).mobile}</p>
              <p className="text-xs text-green-600 font-bold mt-2 bg-green-50 inline-block px-2 py-1 rounded">● Out for delivery</p>
            </div>
          ) : (
            <p className="text-red-500 animate-pulse font-medium bg-red-50 p-2 rounded-lg border border-red-100">⏳ Searching for nearby delivery boys...</p>
          )}

          {availableBoys.length > 0 && !assignedBoy && !myShopOrder?.assignedDeliveryBoy && (
            <div className="mt-3 pt-3 border-t border-orange-200">
              <p className="font-bold text-xs text-gray-500 mb-2">Nearby Available Boys:</p>
              <div className='space-y-1'>
                {availableBoys.map(boy => (
                  <span key={boy.id} className="block text-xs text-gray-700 bg-white p-1 px-2 rounded border border-orange-100">
                    • {boy.fullName} ({boy.mobile})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDER ITEMS */}
      <div className='space-y-3 pt-2'>
        <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider'>Order Items</h3>
        {myShopOrder.shopOrderItems.map((item, index) => (
          <div key={index} className='flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100'>
            <div className='flex items-center gap-3'>
              {item.item?.image ? (
                <img src={item.item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md shadow-sm" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xl">🍲</div>
              )}
              <div>
                <p className='font-bold text-gray-800 text-sm'>{item.name}</p>
                <p className='text-xs font-semibold text-gray-500 mt-0.5'>Qty: <span className='text-gray-800'>{item.quantity}</span> × ₹{item.price}</p>
              </div>
            </div>
            <p className='font-extrabold text-[#ff4d2d]'>₹{item.price * item.quantity}</p>
          </div>
        ))}
      </div>

      {/* TOTAL AMOUNT */}
      <div className='flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200'>
        <p className='font-bold text-gray-600'>Subtotal</p>
        <p className='text-xl font-black text-gray-800'>₹{myShopOrder.subtotal}</p>
      </div>
    </div>
  );
}

export default OwnerOrderCard;