import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setCurrentAddress, setCurrentCity, setCurrentState } from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const apiKey = import.meta.env.VITE_GEOAPIKEY; 

  useEffect(() => {
    // Agar userData nahi hai ya location permission nahi hai to ruk jao
    if (!navigator.geolocation) return;
    
    // Agar city pehle se hai to mat call karo
    if (userData?.city) return; 

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          dispatch(setLocation({ lat: latitude, lon: longitude }));

          const res = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse`,
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
                apiKey: apiKey,
              },
            }
          );

          // 👇 DATA EXTRACTION FIX
          // Geoapify ka response structure: res.data.results array hota hai
          const result = res?.data?.results?.[0];

          if (result) {
            console.log("📍 Geoapify Result:", result); // Debugging ke liye

            // 👇 YAHAN GALTI THI (Ab Sahi Hai):
            // 'result' khud hi wo object hai, uske andar direct keys hoti hain
            const city = result.city || result.county || result.suburb || "Unknown City";
            const state = result.state || "Unknown State";
            const address = result.formatted || result.address_line2 || result.address_line1 || "Unknown Address";

            // Redux me dispatch karo
            dispatch(setCurrentCity(city));
            dispatch(setCurrentState(state));
            dispatch(setCurrentAddress(address));
            
            // Map slice update
            dispatch(setAddress(address)); 
          }
        } catch (err) {
          console.error("❌ Geo API error:", err);
        }
      },
      (err) => {
        console.warn("⚠️ Location denied:", err.message);
      }
    );
  }, [userData, apiKey, dispatch]); 
}

export default useGetCity;