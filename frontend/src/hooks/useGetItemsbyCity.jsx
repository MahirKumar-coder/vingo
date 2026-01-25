import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetItemsbyCity = () => {
  const dispatch = useDispatch();
  const { currentCity } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);

  console.log("CITY FROM REDUX:", currentCity);

  useEffect(() => {
    if (!currentCity) return;

    const fetchItems = async () => {
      try {
        const url = `${serverUrl}/api/item/get-by-city/${currentCity}`;
        console.log("API URL:", url);

        const result = await axios.get(url, {
          withCredentials: true,
        });

        console.log("ITEMS FROM API:", result.data);
        dispatch(setItemsInMyCity(result.data));
      } catch (error) {
        console.log(
          "ITEM FETCH ERROR:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [currentCity, dispatch]);

  return loading;
};

export default useGetItemsbyCity;
