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
    let lastUpdateTime = 0;
    let lastLat = null;
    let lastLon = null;
    const MIN_TIME_INTERVAL = 30000; // 30 seconds minimum
    const MIN_DISTANCE_THRESHOLD = 100; // 100 meters minimum

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000; // meters mein
    };

    const updateLocation = async (lat, lon) => {
        try {
            // Check time interval - minimum 30 seconds
            const now = Date.now();
            if (now - lastUpdateTime < MIN_TIME_INTERVAL) {
              
              return;
            }

            // Check distance - minimum 100 meters
            if (lastLat !== null && lastLon !== null) {
              const distance = calculateDistance(lastLat, lastLon, lat, lon);
              if (distance < MIN_DISTANCE_THRESHOLD) {
                
                return;
              }
            }

            lastUpdateTime = now;
            lastLat = lat;
            lastLon = lon;

            // 👇 3. API Call
            const result = await axios.post(
                `${serverUrl}/api/user/update-location`, 
                { lat, lon },
                { withCredentials: true }
            );

            console.log(" Location Updated:", result.data);
            
            // 👇 4. REDUX DISPATCH
            if (result.data) {
                dispatch(setCurrentCity(result.data.city)); 
                dispatch(setCurrentState(result.data.state));
                dispatch(setCurrentAddress(result.data.address));
            }

        } catch (error) {
            console.error(" Location Update Error:", error);
        }
    };

    // Location Track karna shuru karo
    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (error) => console.log("GPS Error:", error),
        { enableHighAccuracy: false, maximumAge: 5000, timeout: 5000 }
    );

    // 👇 5. Cleanup Function
    return () => navigator.geolocation.clearWatch(watchId);

  }, []); // 🔥 Dependency array khali - sirf mount par run hoga
}

export default useUpdateLocation;