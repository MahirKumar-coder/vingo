import { useState, useEffect } from 'react' // useState add kiya
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders, setUserData } from '../redux/userSlice'
import axios from 'axios' // Axios import karna zaroori hai
import { setMyShopData } from '../redux/ownerSlice'

const useGetMyOrders = () => {
    const dispatch = useDispatch()
    // 1. Loading state banayi, shuru mein TRUE rahegi
    const [loading, setLoading] = useState(true);
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // 2. URL syntax theek kiya: ${serverUrl} alag aur /api alag
                const result = await axios.get(`${serverUrl}/api/order/my-orders`,
                    { withCredentials: true }
                )
                
                // Agar user mil gaya, to store me daalo
                dispatch(setMyOrders(result.data))
                console.log(result.data);
                

            } catch (error) {
                console.log("User not logged in or error:", error)
                // Error aane pe user null set kar sakte ho (optional par safe hai)
                // dispatch(setUserData(null)) 
            } finally {
                // 3. Chahe success ho ya fail, loading khatam karni hai
                setLoading(false);
            }
        }
    
        fetchOrders()
    }, [userData]) // dependency array me dispatch daalna achi practice hai
  
    // 4. Loading status return karo taaki App ko pata chale
    return loading;
}

export default useGetMyOrders