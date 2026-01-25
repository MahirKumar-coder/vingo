import axios from "axios";

const axiosPublic = axios.create({
  withCredentials: false,
});

export default axiosPublic;
