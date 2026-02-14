import React from 'react'
import scooter from '../assets/scooter.png'
import home from '../assets/home.png'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

const deliveryBoyIcon = new L.Icon({
    iconUrl: scooter,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
})
const cutomerIcon = new L.Icon({
    iconUrl: home,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
})

function DeliveryBoyTracking({ data }) {

    const deliveryBoyLat = data.deliveryBoyLocation.lat
    const deliveryBoylon = data.deliveryBoyLocation.lon
    const customerLat = data.customerLocation.lat
    const customerlon = data.customerLocation.lon

    const path = [
        [deliveryBoyLat, deliveryBoylon],
        [customerLat, customerlon]
    ]

    const center = [deliveryBoyLat, deliveryBoylon]

    const changeView = ({ center, zoom }) => {
        const map = useMap();
        map.setView(center, zoom);
        return null;
    }

    return (
        <div className='w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md'>
            <MapContainer center={center} zoom={16} scrollWheelZoom={true} className='w-full h-full'>
                <changeView center={center} />
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={[deliveryBoyLat, deliveryBoylon]} icon={deliveryBoyIcon}>
                    <Popup>Delivery Boy</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

export default DeliveryBoyTracking

// 10:39:41