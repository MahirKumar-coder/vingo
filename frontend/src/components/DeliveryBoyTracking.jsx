import React from 'react'
import scooter from '../assets/scooter.png'
import home from '../assets/home.png'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';

const deliveryBoyIcon = new L.Icon({
    iconUrl: scooter,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const customerIcon = new L.Icon({
    iconUrl: home,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

// 👇 FIX 1: Is component ko main function ke baahar nikala aur 'C' capital kiya (ChangeView)
function ChangeView({ center, zoom }) {
    const map = useMap();
    // Default zoom value set kar di taaki map crash na ho
    map.setView(center, zoom || map.getZoom());
    return null;
}

function DeliveryBoyTracking({ data }) {
    const deliveryBoyLat = data.deliveryBoyLocation.lat;
    const deliveryBoylon = data.deliveryBoyLocation.lon;
    const customerLat = data.customerLocation.lat;
    const customerlon = data.customerLocation.lon;

    const path = [
        [deliveryBoyLat, deliveryBoylon],
        [customerLat, customerlon]
    ];

    const center = [deliveryBoyLat, deliveryBoylon];

    return (
        <div className='w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md'>
            <MapContainer center={center} zoom={16} scrollWheelZoom={true} className='w-full h-full'>
                
                {/* 👇 FIX 2: Capital 'C' ke sath tag lagaya aur zoom prop pass kiya */}
                <ChangeView center={center} zoom={16} />
                
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={[deliveryBoyLat, deliveryBoylon]} icon={deliveryBoyIcon}>
                    <Popup>Delivery Boy</Popup>
                </Marker>
                
                {/* 👇 FIX 3: Customer marker ke popup mein 'Customer' likh diya */}
                <Marker position={[customerLat, customerlon]} icon={customerIcon}>
                    <Popup>Customer Location</Popup>
                </Marker>

                <Polyline positions={path} color='orange' weight={4} />
            </MapContainer>
        </div>
    )
}

export default DeliveryBoyTracking;