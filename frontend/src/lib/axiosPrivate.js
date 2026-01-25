import axios from "axios";

const axiosPrivate = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

export default axiosPrivate;
