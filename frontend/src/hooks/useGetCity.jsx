import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setCurrentAddress, setCurrentCity, setCurrentState } from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  // Ensure .env file has VITE_GEOAPIKEY
  const apiKey = import.meta.env.VITE_GEOAPIKEY; 

  useEffect(() => {
    if (!userData) return;
    if (!navigator.geolocation) return;
    
    // Agar city pehle se saved hai, toh API call mat karo (Optimization)
    if (userData.city) return; 

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Map slice me location set kar rahe hain
          dispatch(setLocation({ lat: latitude, lon: longitude }));

          const res = await axios.get(
            "https://api.geoapify.com/v1/geocode/reverse",
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
                apiKey,
              },
            }
          );

          // Data extraction
          const result = res?.data?.results?.[0];

          if (result) {
            const city = result.city || result.county || result.state || "Unknown";
            const state = result.state || "Unknown";
            const address = result.formatted || result.address_line2 || result.address_line1 || "Unknown address";

            dispatch(setCurrentCity(city));
            dispatch(setCurrentState(state));
            dispatch(setCurrentAddress(address));
            
            // ✅ Fixed Log: Seedha result print karo
            dispatch(setAddress(result.formatted || result.address_line2 || result.address_line1 || "Unknown address")) 
          }
        } catch (err) {
          console.error("Geo API error:", err);
        }
      },
      (err) => {
        console.warn("Location denied:", err.message);
      }
    );
  }, [userData, apiKey, dispatch]); // Dependencies sahi hain
}

export default useGetCity;

// 1:55:57