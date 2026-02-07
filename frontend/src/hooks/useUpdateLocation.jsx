import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

// 👇 1. Import serverUrl (Jahan bhi tumne define kiya hai, e.g., App.jsx or server.js)
import { serverUrl } from "../App"; 

// 👇 2. Import Redux Actions (Taaki state update ho sake)
import { setCurrentCity, setCurrentState, setCurrentAddress } from "../redux/userSlice";

function useUpdateLocation() {
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);

  useEffect(() => {
    
    const updateLocation = async (lat, lon) => {
        try {
            // 👇 3. API Call
            const result = await axios.post(
                `${serverUrl}/api/user/update-location`, 
                { lat, lon }, // Check backend: kya wahan 'lat/lon' chahiye ya 'latitude/longitude'?
                { withCredentials: true }
            );

            console.log("✅ Location Updated:", result.data);
            
            // 👇 4. REDUX DISPATCH (Sabse Important)
            // Agar ye nahi karoge to Dashboard me data nahi dikhega
            if (result.data) {
                dispatch(setCurrentCity(result.data.city)); 
                dispatch(setCurrentState(result.data.state));
                dispatch(setCurrentAddress(result.data.address));
            }

        } catch (error) {
            console.error("❌ Location Update Error:", error);
        }
    };

    // Location Track karna shuru karo
    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (error) => console.log("GPS Error:", error),
        { enableHighAccuracy: true }
    );

    // 👇 5. Cleanup Function (Memory Leak rokne ke liye)
    // Jab component hatega, to location track karna band kar do
    return () => navigator.geolocation.clearWatch(watchId);

  }, [userData, dispatch]); 
}

export default useUpdateLocation;