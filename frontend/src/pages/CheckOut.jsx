import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { MdDeliveryDining } from "react-icons/md";
import { FaMobileAlt } from "react-icons/fa";
import { FaCreditCard } from "react-icons/fa";

// ✅ Import actions
import { setLocation, setAddress } from '../redux/mapSlice';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { addMyOrders } from '../redux/userSlice';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);
    return null;
}

function CheckOut() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Redux State
    const { location, address } = useSelector(state => state.map);
    const { cartItems, totalAmount } = useSelector(state => state.user);
    
    // Local State
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [loading, setLoading] = useState(false); // ✅ Loading State added

    // Configs
    const markerRef = useRef(null);
    const apiKey = import.meta.env.VITE_GEOAPIKEY;
    const serverUrl = import.meta.env.VITE_SERVER_URL; // ✅ Server URL defined

    // Calculations
    const deliveryFee = totalAmount > 500 ? 0 : 40;
    const amountWithDeliveryFee = totalAmount + deliveryFee; // Spelling corrected

    const defaultCenter = [25.5941, 85.1376];
    const currentCenter = location?.lat && location?.lon ? [location.lat, location.lon] : defaultCenter;

    // --- 1. Reverse Geocoding ---
    const getAddressByLatLng = async (lat, lng) => {
        try {
            const res = await axios.get(
                "https://api.geoapify.com/v1/geocode/reverse",
                { params: { lat, lon: lng, format: "json", apiKey } }
            );
            const result = res?.data?.results?.[0];
            const formattedAddr = result?.formatted || result?.address_line2 || result?.address_line1 || "Unknown address";
            dispatch(setAddress(formattedAddr));
        } catch (error) {
            console.error("GeoAPI Error:", error);
        }
    }

    // --- 2. Marker Logic ---
    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const { lat, lng } = marker.getLatLng();
                dispatch(setLocation({ lat, lon: lng }));
                getAddressByLatLng(lat, lng);
            }
        },
    }), [dispatch, apiKey]);

    // --- 3. Current Location ---
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    dispatch(setLocation({ lat: latitude, lon: longitude }));
                    getAddressByLatLng(latitude, longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("Could not extract location.");
                }
            );
        }
    }

    // --- 4. Forward Geocoding ---
    const getLatLngByAddress = async () => {
        if (!address) return;
        try {
            const res = await axios.get("https://api.geoapify.com/v1/geocode/search", {
                params: { text: address, apiKey: apiKey, format: "json" }
            });
            if (res.data.results && res.data.results.length > 0) {
                const { lat, lon } = res.data.results[0];
                dispatch(setLocation({ lat, lon }));
            } else {
                alert("Address not found!");
            }
        } catch (error) {
            console.log("Search Error:", error);
        }
    }

    // --- 5. Place Order Function (Fixed) ---
    const handlePlaceOrder = async () => {
        if (!address) return alert("Please select a delivery address!");
        if (cartItems.length === 0) return alert("Your cart is empty!");

        setLoading(true); // Button disable start
        try {
            const result = await axios.post(`${serverUrl}/api/order/place-order`, {
                paymentMethod,
                deliveryAddress: {
                    text: address, // ✅ Fixed: 'addressInput' ko 'address' se replace kiya
                    latitude: location.lat,
                    longitude: location.lon
                },
                totalAmount: amountWithDeliveryFee,
                cartItems
            }, { withCredentials: true });

            if(result.data.success){
                dispatch(addMyOrders(result.data))
                navigate("/order-placed"); // Redirect user
            }

        } catch (error) {
            console.log(error);
            alert("Failed to place order. Try again.");
        } finally {
            setLoading(false); // Button enable end
        }
    }

    return (
        <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
            <div className='absolute top-[20px] left-[20px] z-[10] cursor-pointer' onClick={() => navigate("/")}>
                <IoIosArrowBack size={35} className='text-[#ff4d2d]' />
            </div>

            <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

                {/* --- Map Section --- */}
                <section>
                    <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
                        <FaLocationDot className='text-[#ff4d2d]' /> Delivery Location
                    </h2>
                    <div className='flex gap-2 mb-3'>
                        <input
                            type="text"
                            className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                            placeholder='Enter your Delivery Address...'
                            value={address || ""}
                            onChange={(e) => dispatch(setAddress(e.target.value))}
                        />
                        <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg' onClick={getLatLngByAddress}>
                            <FaSearch size={17} />
                        </button>
                        <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg' onClick={getCurrentLocation}>
                            <BiCurrentLocation size={17} />
                        </button>
                    </div>
                    <div className='rounded-xl border border-gray-300 overflow-hidden shadow-sm'>
                        <div className='h-72 w-full relative z-0'>
                            <MapContainer center={currentCenter} zoom={15} scrollWheelZoom={true} className='w-full h-full'>
                                <ChangeView center={currentCenter} />
                                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker draggable={true} eventHandlers={eventHandlers} position={currentCenter} ref={markerRef}>
                                    <Popup>{address ? address.substring(0, 40) + "..." : "Selected Location"}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </section>

                {/* --- Payment Method --- */}
                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "bg-gray-50 hover:border-gray-300"}`} onClick={() => setPaymentMethod("cod")}>
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                                <MdDeliveryDining className='text-green-600 text-xl' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>Cash On Delivery</p>
                                <p className='text-xs text-gray-500'>Pay when your food arrives.</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "bg-gray-50 hover:border-gray-300"}`} onClick={() => setPaymentMethod("online")}>
                            <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                                <FaCreditCard className='text-blue-700 text-xl' />
                            </span>
                            <div>
                                <p className='font-medium text-gray-800'>UPI / Cards</p>
                                <p className='text-xs text-gray-500'>Pay Securely Online</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Order Summary --- */}
                <section>
                    <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
                    <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
                        {cartItems.map((item, index) => (
                            <div key={index} className='flex justify-between text-sm text-gray-700'>
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <hr className='border-gray-200 my-2' />
                        <div className='flex justify-between font-medium text-gray-800'>
                            <span>Subtotal</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className='flex justify-between text-gray-700'>
                            <span>Delivery Fee</span>
                            <span className={deliveryFee === 0 ? "text-green-600" : ""}>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                        </div>
                        <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-2'>
                            <span>Total</span>
                            <span>₹{amountWithDeliveryFee}</span>
                        </div>
                    </div>
                </section>

                {/* --- Place Order Button --- */}
                <button 
                    className={`w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold transition active:scale-95 ${loading ? "opacity-70 cursor-not-allowed" : ""}`} 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? "Processing..." : (paymentMethod === 'cod' ? 'Place Order' : 'Pay & Place Order')}
                </button>
            </div>
        </div>
    );
}

export default CheckOut;