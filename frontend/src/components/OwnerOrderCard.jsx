import axios from 'axios';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { serverUrl } from '../App';

function OwnerOrderCard({ data }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // ---------------------------------------------------------
  // STEP 1: Sabse pehle Data Calculate karo (State banane se pehle)
  // ---------------------------------------------------------

  // Safety check: Agar data hi nahi hai to crash mat hone do
  const safeShopOrders = data?.shopOrders || [];

  const myShopOrder = safeShopOrders.find((shopOrder) => {
    const ownerId = shopOrder.owner?._id || shopOrder.owner;
    // Optional chaining (?.) lagaya taaki userData null ho to crash na kare
    return String(ownerId) === String(userData?._id);
  });

  // ---------------------------------------------------------
  // STEP 2: State Define karo (Hooks Always at Top)
  // ---------------------------------------------------------

  // Yahan hum ?. (optional chaining) use kar rahe hain taaki agar 
  // myShopOrder undefined ho, to code phate nahi, bas default value lele.
  const [status, setStatus] = useState(myShopOrder?.status || 'Pending');
  const [assignedBoy, setAssignedBoy] = useState(myShopOrder?.assignedDeliveryBoy || null);
  const [availableBoys, setAvailableBoys] = useState([]);

  // ---------------------------------------------------------
  // STEP 3: Ab Safety Checks lagao (Hooks ke baad)
  // ---------------------------------------------------------
  if (!userData) return <div className="p-2">Loading User...</div>;
  if (!data || !myShopOrder) return null; // Agar ye order mera nahi hai to mat dikhao

  // ---------------------------------------------------------
  // STEP 4: Functions
  // ---------------------------------------------------------
  const handleUpdateStatus = async (e) => {
    const newStatus = e.target.value;
    const oldStatus = status;

    // Optimistic UI Update
    setStatus(newStatus);

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
    if (st === 'Pending') return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    if (st === 'Preparing') return 'text-blue-600 border-blue-200 bg-blue-50';
    if (st === 'Out for Delivery') return 'text-purple-600 border-purple-200 bg-purple-50'; // Spelling Match ✅
    if (st === 'Delivered') return 'text-green-600 border-green-200 bg-green-50';
    return 'text-gray-600 border-gray-200';
  }

  // ---------------------------------------------------------
  // STEP 5: UI Render
  // ---------------------------------------------------------
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
          <select
            value={status}
            onChange={handleUpdateStatus}
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

      {/* DELIVERY DETAILS BOX */}
      {status === 'Out for Delivery' && (
        <div className='mt-3 p-3 border rounded-lg bg-orange-50 text-sm'>
          <p className="font-semibold text-orange-700 mb-2">🚚 Delivery Details</p>

          {assignedBoy ? (
            <div className="bg-white p-2 rounded shadow-sm">
              {data.shopOrders.assignedDeliveryBoy?<p>Assigned Delivery Boy:</p>:<p>Available Delivery Boy:</p>}
              <p className="font-bold text-gray-800">👤 {assignedBoy.fullName}</p>
              <p className="text-gray-600">📞 {assignedBoy.mobile}</p>
              <p className="text-xs text-green-600 font-semibold mt-1">● Assigned Successfully</p>
            </div>
          ) : data.shopOrders.assignedDeliveryBoy ? <div>{data.shopOrder.assignedBoy.fullName}</div> :
            <p className="text-red-500 animate-pulse">Searching for nearby delivery boys...</p>
          }

          {availableBoys.length > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-200">
              <p className="font-bold text-xs text-gray-500 mb-1">Nearby Available:</p>
              {availableBoys.map(boy => (
                <span key={boy.id} className="block text-xs text-gray-600">
                  • {boy.fullName} ({boy.mobile})
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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