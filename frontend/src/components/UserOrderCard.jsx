import React from 'react';

// 👇 FIX: 'order' ki jagah 'data' receive karo (Parent se 'data' aa raha hai)
function UserOrderCard({ data }) { 
  
  // Safety Check: Agar data undefined hai to crash mat hone do
  if (!data) return null;

  const order = data; // Variable ka naam 'order' hi rakhte hain taaki neeche code na badalna pade

  const getStatusBadge = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Preparing": "bg-blue-100 text-blue-800",
      "Out for Delivery": "bg-purple-100 text-purple-800",
      "Delivered": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <div>
           {/* Ab yahan crash nahi hoga kyunki 'order' defined hai */}
           <span className="font-bold text-gray-700">Order #{order._id?.slice(-6)}</span>
           <p className="text-xs text-gray-500">
             {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Date N/A"}
           </p>
        </div>
        <div className="text-sm font-semibold text-gray-600">
          Total: ₹{order.totalAmount}
        </div>
      </div>

      {/* Shop-wise Status Section */}
      <div className="space-y-3">
        {order.shopOrders && order.shopOrders.map((shopOrder, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-md">
            
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm text-gray-800">
                {shopOrder.shop?.name || "Shop Name"}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(shopOrder.status)}`}>
                {shopOrder.status}
              </span>
            </div>

            <div className="space-y-1 pl-2 border-l-2 border-gray-300">
              {shopOrder.shopOrderItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-600">
                  <span>{item.quantity} x {item.name}</span>
                  <span>₹{item.price}</span>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default UserOrderCard;