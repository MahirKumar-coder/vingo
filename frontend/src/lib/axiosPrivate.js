import axios from "axios";

const axiosPrivate = axios.create({
  // ✅ Yahan bhi variable use karo
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:8000",
  withCredentials: true,
});

export default axiosPrivate;