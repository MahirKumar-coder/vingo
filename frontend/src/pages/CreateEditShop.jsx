import React, { useEffect, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CiForkAndKnife } from "react-icons/ci";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { setMyShopData } from "../redux/ownerSlice";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const CreateEditShop = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { myShopData } = useSelector((state) => state.owner);
  const { currentCity, currentState, currentAddress } =
    useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const cleanValue = (value) =>
    value && value !== "null" && value !== "undefined" ? value : "";

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      alert("Shop name is required");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city || currentCity || "");
      formData.append("state", state || currentState || "");
      formData.append("address", address || currentAddress || "");

      if (backendImage) {
        formData.append("image", backendImage);
      }

      const res = await axios.post(
        `${serverUrl}/api/shop/create-edit`,
        formData,
        { withCredentials: true }
      );

      dispatch(setMyShopData(res.data));
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myShopData) {
      setName(cleanValue(myShopData.name));
      setCity(cleanValue(myShopData.city) || cleanValue(currentCity));
      setState(cleanValue(myShopData.state) || cleanValue(currentState));
      setAddress(
        cleanValue(myShopData.address) || cleanValue(currentAddress)
      );
      setFrontendImage(myShopData.image || null);
    } else {
      setCity(cleanValue(currentCity));
      setState(cleanValue(currentState));
      setAddress(cleanValue(currentAddress));
    }
  }, [myShopData, currentCity, currentState, currentAddress]);

  return (
    <div className="flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-white min-h-screen relative">
      <div
        className="absolute top-5 left-5 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <IoIosArrowBack size={35} className="text-[#ff4d2d]" />
      </div>

      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <CiForkAndKnife className="text-[#ff4d2d] w-16 h-16" />
          </div>
          <h1 className="text-3xl font-extrabold">
            {myShopData ? "Edit Shop" : "Add Shop"}
          </h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            placeholder="Shop Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />

          <input type="file" accept="image/*" onChange={handleImage} />

          {frontendImage && (
            <img
              src={frontendImage}
              className="w-full h-48 object-cover rounded"
            />
          )}

          <input value={city} onChange={(e) => setCity(e.target.value)} />
          <input value={state} onChange={(e) => setState(e.target.value)} />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            className="w-full bg-[#ff4d2d] text-white py-3 rounded-lg font-semibold flex justify-center"
            disabled={loading}
          >
            {loading ? <ClipLoader size={20} color="white" /> : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEditShop;