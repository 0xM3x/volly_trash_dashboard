import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { io } from 'socket.io-client';
import userIconImg from '../assets/userLocation.png';
import deviceIconImg from '../assets/deviceLocation.png';

const userIcon = new L.Icon({
  iconUrl: userIconImg,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [1, -40],
});

const deviceIcon = new L.Icon({
  iconUrl: deviceIconImg,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [1, -40],
});

const socket = io('http://localhost:8000');

export default function RouteMapPage() {
  const [allDevices, setAllDevices] = useState([]);
  const [fullBins, setFullBins] = useState([]);
  const [route, setRoute] = useState(null);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
  }, []);

  const updateMarkers = async () => {
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

  useEffect(() => {
    updateMarkers();
  }, []);

  useEffect(() => {
    socket.on('notification', (data) => {
      if (data.device_id) {
        console.log('[📡] notification received:', data);
        updateMarkers();
      
        if (data.type === 'full' || data.type === 'empty') {
          handleOptimizeRoute();
        }
      }
    });

    socket.on('sensor-data', (data) => {
      console.log('[📡] sensor-data received:', data);
      setAllDevices(prev =>
        prev.map(d =>
          d.unique_id === data.id ? { ...d } : d
        )
      );
    });

    return () => {
      socket.off('notification');
      socket.off('sensor-data');
    };
  }, [userLocation]);

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

  const mapCenter = userLocation || (allDevices.length
    ? [allDevices[0].latitude, allDevices[0].longitude]
    : [41.015137, 28.979530]);

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
            <Marker position={userLocation} icon={userIcon}>
              <Popup>Başlangıç Noktası (Siz)</Popup>
            </Marker>
          )}

          {allDevices.map((d) => (
            <Marker
              key={d.id}
              position={[d.latitude, d.longitude]}
              icon={deviceIcon}
            >
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
