import React, { useEffect, useMemo, useRef } from 'react'; // useState hata diya, zaroorat nahi
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

// ✅ Import both actions
import { setLocation, setAddress } from '../redux/mapSlice';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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
    const { location, address } = useSelector(state => state.map);
    const markerRef = useRef(null);
    const apiKey = import.meta.env.VITE_GEOAPIKEY;

    const defaultCenter = [25.5941, 85.1376];
    const currentCenter = location?.lat && location?.lon ? [location.lat, location.lon] : defaultCenter;

    // ✅ Fix 1: API Call Logic Corrected
    const getAddressByLatLng = async (lat, lng) => {
        try {
            const res = await axios.get(
                "https://api.geoapify.com/v1/geocode/reverse",
                {
                    params: {
                        lat,
                        lon: lng,
                        format: "json",
                        apiKey,
                    },
                }
            );

            // Response aane ke baad data nikalo
            const result = res?.data?.results?.[0];
            const formattedAddr = result?.formatted || result?.address_line2 || result?.address_line1 || "Unknown address";
            
            // ✅ Redux Update: Taaki input box mein address change ho jaye
            dispatch(setAddress(formattedAddr));
            
        } catch (error) {
            console.error("GeoAPI Error:", error);
        }
    }

    // ✅ Fix 2: Consolidated Drag Logic (Ek hi handler)
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    
                    // 1. Redux Update Location
                    dispatch(setLocation({ lat, lon: lng }));
                    
                    // 2. Fetch New Address
                    getAddressByLatLng(lat, lng);
                }
            },
        }),
        [dispatch, apiKey] // Dependencies add kar di
    );

    return (
        <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
            <div className='absolute top-[20px] left-[20px] z-[10] cursor-pointer' onClick={() => navigate("/")}>
                <IoIosArrowBack size={35} className='text-[#ff4d2d]' />
            </div>

            <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
                <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

                <section>
                    <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
                        <FaLocationDot className='text-[#ff4d2d]' /> Delivery Location
                    </h2>

                    <div className='flex gap-2 mb-3'>
                        {/* ✅ Fix 3: Controlled Input (value + onChange) */}
                        {/* Agar drag karoge to address badlega, agar type karoge to bhi badlega */}
                        <input
                            type="text"
                            className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                            placeholder='Enter your Delivery Address...'
                            value={address || ""} 
                            onChange={(e) => dispatch(setAddress(e.target.value))}
                        />
                        <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg flex items-center justify-center cursor-pointer'>
                            <FaSearch size={17} />
                        </button>
                        <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center cursor-pointer'>
                            <BiCurrentLocation size={17} />
                        </button>
                    </div>

                    <div className='rounded-xl border border-gray-300 overflow-hidden shadow-sm'>
                        <div className='h-72 w-full relative z-0'>
                            <MapContainer
                                center={currentCenter}
                                zoom={15}
                                scrollWheelZoom={true}
                                className='w-full h-full'
                            >
                                <ChangeView center={currentCenter} />
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* ✅ Single Clean Marker Component */}
                                <Marker
                                    draggable={true}
                                    eventHandlers={eventHandlers}
                                    position={currentCenter}
                                    ref={markerRef}
                                >
                                    <Popup>
                                        {address ? address.substring(0, 40) + "..." : "Selected Location"}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default CheckOut;