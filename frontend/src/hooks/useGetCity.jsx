import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setCurrentAddress, setCurrentCity, setCurrentState } from "../redux/userSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!userData) return;
    if (!navigator.geolocation) return;
    if(userData.city) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

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

          const result = res?.data?.results?.[0];

          const city =
            result?.city ||
            result?.county ||
            result?.state ||
            "Unknown";

          const state =
            result?.state || "Unknown";
          
          const address =
            result.address_line2 ||
            result.address_line1 ||
            "Unknown address";

          dispatch(setCurrentCity(city));
          dispatch(setCurrentState(state));
          dispatch(setCurrentAddress(address));

        } catch (err) {
          console.error("Geo API error:", err);
        }
      },
      (err) => {
        console.warn("Location denied:", err.message);
      }
    );
  }, [userData, apiKey, dispatch]);
}

export default useGetCity;
// 08:02:24