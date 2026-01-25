import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DelivaryBoy from '../components/DelivaryBoy'

function Home() {
  const { userData } = useSelector(state => state.user)
  return (
    <div className='w-screen min-h-screen pt-[100px] flex flex-col items-center bg-[#fff9f6]'>
      {userData.role == 'user' && <UserDashboard />}
      {userData.role == 'owner' && <OwnerDashboard />}
      {userData.role == 'deliveryBoy' && <DelivaryBoy />}
    </div>
  )
}

export default Home
