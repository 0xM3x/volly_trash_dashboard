import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import TopBar from '../components/TopBar';

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
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Load user info to control TopBar props
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
  }, []);

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

  // Live location tracking
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error('Konum izlenemedi:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Optimize route between full bins, starting from user location
  const handleOptimizeRoute = async () => {
    if (!userLocation) {
      alert('Konum alınamadı, lütfen konum izinlerini kontrol edin.');
      return;
    }

    const start = {
      lat: userLocation[0],
      lng: userLocation[1]
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/devices/route',
        { start },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRoute(response.data.route);
      setFullBins(response.data.devices);
    } catch (err) {
      console.error('Rota oluşturulamadı:', err);
      alert('Rota oluşturulamadı. Bir hata oluştu.');
    }
  };

  const mapCenter = userLocation || (allDevices.length
    ? [allDevices[0].latitude, allDevices[0].longitude]
    : [41.015137, 28.979530]); // fallback to Istanbul

  return (
    <>
      {user && <TopBar hideNotifications={user.role === 'client_user'} />}
      <div className="relative h-[calc(100vh-64px)] w-full">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {userLocation && (
            <Marker position={userLocation} icon={customIcon}>
              <Popup>Başlangıç Noktası (Siz)</Popup>
            </Marker>
          )}

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
    </>
  );
}
