import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { serverUrl } from '../App'
import { useParams } from 'react-router-dom'

function TrackOrderPage() {
    const {orderId} = useParams()
    const [currentOrder, setCurrentOrder] = useState()
    const handleGetOrder = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-order-by-id/${orderId}`, {withCredentials:true})
            setCurrentOrder(result.data);
            
        } catch (error) {
            console.log(error);
            
        }
    }

    useEffect(()=>{
        handleGetOrder()
    }, [orderId])
  return (
    <div>TrackOrderPage</div>
  )
}

export default TrackOrderPage

// 11:06:45