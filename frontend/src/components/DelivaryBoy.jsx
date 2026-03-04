import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ClipLoader } from 'react-spinners'

const DelivaryBoy = () => {
  const { userData, socket } = useSelector(state => state.user)
  const [otp, setOtp] = useState('')

  const [availableAssignments, setAvailableAssignments] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null)
  const [todayDeliveries, setTodayDeliveries] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let watchId;

    if (socket && userData?.role === "deliveryBoy") {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            setDeliveryBoyLocation({ lat: latitude, lon: longitude })

            socket.emit('updateLocation', {
              latitude,
              longitude,
              userId: userData._id
            });
          },
          (error) => {
            console.error("❌ GPS Error:", error.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        );
      } else {
        console.error("Browser doesn't support Geolocation");
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [socket, userData]);

  const ratePerDelivery = 50;
  const totalEarning = todayDeliveries.reduce((sum, d) => sum + d.count * ratePerDelivery, 0)

  const getAssignment = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })
      console.log(res.data)
      setAvailableAssignments(res.data.assignments || res.data)
    } catch (error) {
      console.log(error)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        {},
        { withCredentials: true }
      );

      console.log("Success:", res.data);

      setAvailableAssignments((prevOrders) =>
        prevOrders.filter((order) => order.assignmentId !== assignmentId)
      );

      await getCurrentOrder()

    } catch (error) {
      console.log("Backend Error Message:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Order accept karne mein error aayi");
    }
  }

  const sendOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id
        },
        { withCredentials: true }

      );
      setLoading(false)
      setShowOtpBox(true);
      console.log("OTP Sent:", res.data);

    } catch (error) {
      console.error(error);
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setMessage("")
    try {
      const res = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
          otp: otp
        },
        { withCredentials: true }
      );

      console.log("Success:", res.data);
      setMessage(res.data.message)
      location.reload()

      setShowOtpBox(false);
      setOtp("");
      await getCurrentOrder();

    } catch (error) {
      console.error("OTP Error:", error);
      alert(error.response?.data?.message || "Invalid OTP");
    }
  }

  const handleTodayDeliveries = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/order/get-today-deliveries`,
        { withCredentials: true }
      );

      console.log("BACKEND KA DATA 👉", res.data); // Console mein check karna kya aaya

      // Backend response ko zaroorat ke hisaab se format karo
      const formattedData = res.data.map(item => ({
        // Agar backend se '_id' ya kuch aur aa raha hai, toh usko 'hour' bana do
        hour: item.hour || item._id || "Unknown",
        // Agar backend se 'total' ya 'orders' aa raha hai, toh usko 'count' bana do
        count: item.count || item.total || item.totalOrders || 0
      }));

      setTodayDeliveries(formattedData);

    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  }

  useEffect(() => {
    socket.on('newAssignment', (data) => {
      if (data.sentTo == userData._id) {
        setAvailableAssignments(prev => [...prev, data])
      }
    })

    return () => {
      socket?.off('newAssignment')
    }
  }, [socket, userData._id])

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })
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
    handleTodayDeliveries()
  }, [userData])


  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <div className='w-full max-w-800px flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData?.fullName} </h1>
          <p className='text-[#ff4d2d]'>
            {/* 👇 FIX 1: Null check lagaya (Optional Chaining aur Fallback) */}
            <span className='font-semibold'>Latitude:</span> {deliveryBoyLocation?.lat || userData?.location?.coordinates?.[1]},
            <span className='font-semibold'>Longitude:</span> {deliveryBoyLocation?.lon || userData?.location?.coordinates?.[0]}
          </p>
        </div>

        <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100'>
          <h1 className='text-lg font-bold mb-3 text-[#ff4d2d]'>Today Deliveries</h1>

          <div style={{ width: '100%', height: 250 }} className="flex justify-center items-center">

            {/* 👇 FIX: Conditional Rendering - Data hai toh chart, nahi toh message */}
            {todayDeliveries && todayDeliveries.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={todayDeliveries}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: '#fff9f6' }} />
                    <Bar dataKey="count" fill="#ff4d2d" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>

                <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
                  <h1 className='text-xl font-semibold text-gray-800 mb-2'>Today's Earning</h1>
                  <span className='text-3xl font-bold text-green-600'>₹{totalEarning}</span>
                </div>
              </>
            ) : (
              // 👇 Agar array khali hai toh yeh message dikhega
              <div className="flex flex-col items-center text-gray-400">
                <span className="text-3xl mb-2">🚚</span>
                <p className="font-medium text-sm">No deliveries yet for today</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
        <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Orders</h1>

        <div className='space-y-4'>
          {availableAssignments.length > 0 ? (
            availableAssignments.map((a, index) => (
              <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
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

        {/* 👇 FIX 2: Valid Object Syntax for data prop */}
        <DeliveryBoyTracking data={{
          deliveryBoyLocation: deliveryBoyLocation ? deliveryBoyLocation : {
            lat: userData?.location?.coordinates?.[1],
            lon: userData?.location?.coordinates?.[0]
          },
          customerLocation: {
            lat: currentOrder?.deliveryAddress?.latitude,
            lon: currentOrder?.deliveryAddress?.longitude
          }
        }} />

        {!showOtpBox ? <button className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={sendOtp} disabled={loading}>
          {loading ? <ClipLoader size={20} color='white'/> : "Mark as Delivered"}
        </button> : <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
          <p className='text-sm font-semibold mb-2'>Enter Otp send to <span className='text-orange-500'>{currentOrder?.user?.fullName || "Customer"}</span></p>
          <input type="text" className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' placeholder='Enter OTP' onChange={(e) => setOtp(e.target.value)} value={otp} />
          {message && <p className='text-center text-green-400'>{message}</p>}
          <button className='w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all' onClick={verifyOtp}>Submit OTP</button>
        </div>}
      </div>}

    </div>
  )
}

export default DelivaryBoy

// 6:12:46