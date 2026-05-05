import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack } from "react-icons/io";
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';

// 👇 FIX 1: setMyOrders ki jagah addMyOrders import karo
import { addMyOrders } from '../redux/userSlice';

function MyOrders() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 👇 FIX 2: Redux se 'socket' bhi nikalo jo humne App.jsx me set kiya tha
    // (Ensure karo ki tumhare userSlice me socket ka naam yahi hai)
    const { userData, MyOrders, socket } = useSelector(state => state.user);



    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-[800px] p-4'>
                <div className='flex items-center gap-[20px] mb-6 '>
                    <div className='cursor-pointer z-[10]' onClick={() => navigate("/")}>
                        <IoIosArrowBack size={35} className='text-[#ff4d2d]' />
                    </div>
                    <h1 className='text-2xl font-bold text-start'>My Orders</h1>
                </div>

                <div className='space-y-6'>
                    {MyOrders && MyOrders.length > 0 ? (
                        MyOrders.map((order, index) => (
                            userData?.role === 'user' ? (
                                <UserOrderCard data={order} key={order._id || index} />
                            ) : userData?.role === 'owner' ? (
                                <OwnerOrderCard data={order} key={order._id || index} />
                            ) : null
                        ))
                    ) : (
                        <p className="text-center text-gray-500 mt-10">No orders found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyOrders;