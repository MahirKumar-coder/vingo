import React from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { CiForkAndKnife } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import { FaPen } from "react-icons/fa";
import OwnerItemCard from './OwnerItemCard.jsx';

const OwnerDashboard = () => {
  const navigate = useNavigate();

  // ✅ Redux data (safe)
  const { myShopData } = useSelector(state => state.owner);
  const { currentCity, currentState, currentAddress } =
    useSelector(state => state.user);

  // ✅ ALWAYS SAFE ARRAY
  const items = myShopData?.items || [];

  // ✅ Fallback logic
  const city =
    myShopData?.city && myShopData.city !== "undefined"
      ? myShopData.city
      : currentCity;

  const state =
    myShopData?.state && myShopData.state !== "null"
      ? myShopData.state
      : currentState;

  const address =
    myShopData?.address && myShopData.address !== "null"
      ? myShopData.address
      : currentAddress;

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex flex-col items-center'>
      <Nav />

      {/* ❌ NO SHOP */}
      {!myShopData && (
        <div className='flex justify-center items-center p-4 sm:p-6'>
          <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100'>
            <div className='flex flex-col items-center text-center'>
              <CiForkAndKnife className='text-[#ff4d2d] w-20 h-20 mb-4' />
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>
                Add Your Restaurant
              </h2>
              <p className='text-gray-600 mb-4'>
                Start selling by creating your shop
              </p>
              <button
                className='bg-[#ff4d2d] text-white px-6 py-2 rounded-full'
                onClick={() => navigate("/create-edit-shop")}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SHOP EXISTS */}
      {myShopData && (
        <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6'>

          {/* SHOP HEADER */}
          <h1 className='text-3xl text-gray-900 flex items-center gap-3 mt-8'>
            <CiForkAndKnife className='text-[#ff4d2d]' />
            Welcome to {myShopData.name}
          </h1>

          {/* SHOP CARD */}
          <div className='bg-white shadow-lg rounded-xl overflow-hidden border w-full max-w-3xl relative'>
            <div
              className='absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full cursor-pointer'
              onClick={() => navigate('/create-edit-shop')}
            >
              <FaPen size={18} />
            </div>

            <img
              src={myShopData.image}
              alt={myShopData.name}
              className='w-full h-64 object-cover'
            />

            <div className='p-6'>
              <h2 className='text-2xl font-bold text-gray-800'>
                {myShopData.name}
              </h2>
              <p className='text-gray-500'>{city}, {state}</p>
              <p className='text-gray-500'>{address}</p>
            </div>
          </div>

          {/* ❌ NO ITEMS */}
          {items.length === 0 && (
            <div className='flex justify-center items-center p-6'>
              <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6'>
                <div className='flex flex-col items-center text-center'>
                  <CiForkAndKnife className='text-[#ff4d2d] w-20 h-20 mb-4' />
                  <h2 className='text-2xl font-bold mb-2'>
                    Add Your First Food Item
                  </h2>
                  <p className='text-gray-600 mb-4'>
                    Your menu is empty
                  </p>
                  <button
                    className='bg-[#ff4d2d] text-white px-6 py-2 rounded-full'
                    onClick={() => navigate("/add-item")}
                  >
                    Add Food
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ITEMS LIST */}
          {items.length > 0 && (
            <div className='flex flex-col items-center gap-4 w-full max-w-3xl'>
              {items.map(item => (
                <OwnerItemCard key={item._id} data={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
