import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function RouteMapPage() {
  const [allDevices, setAllDevices] = useState([]); // for initial pins
  const [fullBins, setFullBins] = useState([]);     // for optimized route
  const [route, setRoute] = useState(null);

  // Fetch all devices (for markers)
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/devices/map', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const devicesWithCoords = (res.data.devices || []).filter(d =>
          d.latitude && d.longitude
        ).map(d => ({
          ...d,
          latitude: parseFloat(d.latitude),
          longitude: parseFloat(d.longitude)
        }));

        setAllDevices(devicesWithCoords);
      } catch (err) {
        console.error('Cihazlar yüklenemedi:', err);
      }
    };
    loadDevices();
  }, []);

  // Optimize route between full bins
  const handleOptimizeRoute = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/devices/route', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoute(response.data.route);
      setFullBins(response.data.devices);
    } catch (err) {
      console.error('Rota oluşturulamadı:', err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Rota oluşturulamadı. Bir hata oluştu.');
      }
    }
  };

  const mapCenter = allDevices.length
    ? [allDevices[0].latitude, allDevices[0].longitude]
    : [41.015137, 28.979530]; // fallback to Istanbul

  return (
    <div className="relative h-screen w-full">
      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {allDevices.map((d) => (
          <Marker key={d.device_id || d.id} position={[d.latitude, d.longitude]} icon={customIcon}>
            <Popup>
              <strong>{d.name}</strong>
            </Popup>
          </Marker>
        ))}

        {route && (
          <Polyline
            positions={route.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])}
            color="blue"
          />
        )}
      </MapContainer>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded absolute bottom-4 right-4 z-[1000] shadow-lg"
        onClick={handleOptimizeRoute}
      >
        Çöp Topla
      </button>
    </div>
  );
}
