import React from 'react'

function UserOrderCard({data}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
      <div className='flex justify-between border-b pb-2'>
        <div>
          <p className='font-semibold'>
            order #{data._id.slice(-6)}
          </p>
          <p className='text-sm text-gray-500'>
            Date: {formatDate(data.createdAt)}
          </p>
        </div>
        <div className='text-right'>
          <p>{data.paymentMethod?.toUpperCase()}</p>
          <p className='font-medium text-blue-600'>{data.shopOrders?.[0].status}</p>
        </div>
      </div>

      {data.shopOrders.map((shopOrder, index) => (
        <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
          <p>{shopOrder.shop.name}</p>

          <div className='flex space-x-4 overflow-x-auto pb-2'>
            {shopOrder.shopOrderItems.map((item, index) => (
              <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                <img src={item.image} alt="" className='w-full h-24 object-cover rounded' />
                <p className='text-sm font-semibold mt-1'>{item.name}</p>
                <p className='text-xs text-gray-500'>₹{item.price} x {item.quantity}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default UserOrderCard

// 5:38:39