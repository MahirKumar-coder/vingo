import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios' // Axios import karna mat bhulna
// Apne serverUrl ka sahi path import karein
import { serverUrl } from '../App' // Ya jaha bhi define ho
import DeliveryBoyTracking from './DeliveryBoyTracking'

const DelivaryBoy = () => {
  const { userData } = useSelector(state => state.user)
  const [otp, setOtp] = useState('')

  // ✅ FIX 1: Initial state ko null ki jagah empty array [] rakho
  const [availableAssignments, setAvailableAssignments] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [showOtpBox, setShowOtpBox] = useState(false)

  const getAssignment = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })

      // ✅ FIX 3: Sahi variable use karo aur State update karo
      console.log(res.data)
      setAvailableAssignments(res.data.assignments || res.data) // API response ke hisab se set karo

    } catch (error) {
      console.log(error)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      // 1. Backend को रिक्वेस्ट भेजें
      const res = await axios.post(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        {},
        { withCredentials: true }
      );

      console.log("Success:", res.data);

      // ✅ 2. UI से इस ऑर्डर को तुरंत हटा दें (Magic Line)
      // यह लाइन लिस्ट में से उस ऑर्डर को हटा देगी जिसे अभी एक्सेप्ट किया गया है
      setAvailableAssignments((prevOrders) =>
        prevOrders.filter((order) => order.assignmentId !== assignmentId)
      );

      await getCurrentOrder()

    } catch (error) {
      console.log("Backend Error Message:", error.response?.data || error.message);
      // अगर कोई एरर आए तो स्क्रीन पर दिखा दें
      alert(error.response?.data?.message || "Order accept karne mein error aayi");
    }
  }

  const sendOtp = async () => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id
        },
        { withCredentials: true }
      );

      setShowOtpBox(true);
      console.log("OTP Sent:", res.data);

    } catch (error) {
      console.error(error);
      alert("Failed to send OTP");
    }
  }

  const verifyOtp = async () => {
    try {
      // 1. Backend ko request bhejein
      const res = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
          otp: otp // State se aa raha hai
        },
        { withCredentials: true }
      );

      console.log("Success:", res.data);
      alert("Order Delivered Successfully!");

      // OTP verify hone ke baad screen clear kar do aur current order hata do
      setShowOtpBox(false);
      setOtp("");
      await getCurrentOrder(); // Ye ab null set kar dega kyunki order deliver ho gaya

    } catch (error) {
      console.error("OTP Error:", error);
      alert(error.response?.data?.message || "Invalid OTP");
    }
  }

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })

      // ✅ STEP 1: Yahan console.log lagao
      console.log("MERA ORDER DATA:", result.data.order);

      setCurrentOrder(result.data.order);
    } catch (error) {
      console.log(error);
      setCurrentOrder(null);
    }
  }



  useEffect(() => {
    getAssignment()
    getCurrentOrder()
  }, [userData])



  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          {/* Optional chaining (?.) lagaya taaki agar data na ho to crash na ho */}
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData?.fullName} </h1>
          <p className='text-[#ff4d2d]'>
            <span className='font-semibold'>Latitude:</span> {userData?.location?.coordinates[1]},
            <span className='font-semibold'>Longitude:</span> {userData?.location?.coordinates[0]}
          </p>
        </div>
      </div>

      {!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
        <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Orders</h1>

        <div className='space-y-4'>

          {/* Ab ye line crash nahi karegi kyunki humne [] use kiya hai */}
          {availableAssignments.length > 0 ? (
            availableAssignments.map((a, index) => (
              <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                {/* Yahan API ka data show karo */}
                <div>
                  <p className='text-sm font-semibold'>{a?.shopName}</p>
                  <p className='text-sm text-gray-500'><span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress.text}</p>
                  <p className='text-xs text-gray-400'>{a.items.length} items | {a.subtotal}</p>
                </div>
                <button className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600' onClick={() => acceptOrder(a.assignmentId)}>Accept</button>
              </div>
            ))
          ) : (
            <p className='text-gray-400 text-sm'>No Available Orders</p>
          )}

        </div>
      </div>}

      {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
        <h2 className='text-lg font-bold mb-3'>📦Current Order</h2>
        <div className='border rounded-lg p-4 mb-3'>
          <p className='font-semibold text-sm'>{currentOrder?.shopOrder.shop.name}</p>
          <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress.text}</p>
          <p className='text-xs text-gray-400'>{currentOrder.shopOrder.shopOrderItems.length} items | {currentOrder.shopOrder.subtotal}</p>
        </div>

        <DeliveryBoyTracking data={currentOrder} />
        {!showOtpBox ? <button className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={sendOtp}>
          Mark As Delivered
        </button> : <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
          <p className='text-sm font-semibold mb-2'>Enter Otp send to <span className='text-orange-500'>{currentOrder?.user?.fullName || "Customer"}</span></p>
          <input type="text" className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' placeholder='Enter OTP' onChange={(e) => setOtp(e.target.value)} value={otp} />
          <button className='w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all' onClick={verifyOtp}>Submit OTP</button>
        </div>}
      </div>}

    </div>
  )
}

export default DelivaryBoy

// 10:51:59