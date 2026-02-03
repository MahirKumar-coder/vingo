import React, { useEffect } from 'react' // 1. useEffect import kiya
import { useSelector, useDispatch } from 'react-redux' // 2. useDispatch import kiya
import { useNavigate } from 'react-router-dom'; // 3. useNavigate import kiya
import { IoIosArrowBack } from "react-icons/io";
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
// 👇 Apne action ka sahi path import karna
// import { getMyOrders } from '../store/actions/userActions'; 

function MyOrders() {
    const navigate = useNavigate(); // ✅ Fix: Navigate Hook
    const dispatch = useDispatch(); // ✅ Fix: Dispatch Hook
    
    // 👇 Dhyan de: Redux state me spelling check kar lena (myOrders vs MyOrders)
    const { userData, MyOrders } = useSelector(state => state.user);

    // ✅ Fix: Page load hote hi data mangwana padega
    useEffect(() => {
        // Agar action ka naam 'getMyOrders' hai to ye line uncomment karo:
        // dispatch(getMyOrders()); 
    }, [dispatch]);

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
            <div className='w-full max-w-[800px] p-4'>
                <div className='flex items-center gap-[20px] mb-6 '>
                    {/* ✅ navigate ab sahi chalega */}
                    <div className='cursor-pointer z-[10]' onClick={() => navigate("/")}>
                        <IoIosArrowBack size={35} className='text-[#ff4d2d]' />
                    </div>
                    <h1 className='text-2xl font-bold text-start'>My Orders</h1>
                </div>

                <div className='space-y-6'>
                    {/* ✅ Check: Agar orders hain tabhi map chalega */}
                    {MyOrders && MyOrders.length > 0 ? (
                        MyOrders.map((order, index) => (
                            userData?.role === 'user' ? (
                                <UserOrderCard data={order} key={order._id || index} />
                            ) : userData?.role === 'owner' ? (
                                <OwnerOrderCard data={order} key={order._id || index} />
                            ) : null
                        ))
                    ) : (
                        // ✅ Empty state message
                        <p className="text-center text-gray-500 mt-10">No orders found.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MyOrders