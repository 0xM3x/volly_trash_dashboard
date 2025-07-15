import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { io } from 'socket.io-client';
import userIconImg from '../assets/green-marker.png';
import deviceIconImg from '../assets/red-marker.png';
import toast from 'react-hot-toast';

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
  const mapRef = useRef();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    if (storedUser?.id) {
      socket.emit('register', storedUser.id.toString());
      console.log('[📡] Registered user for socket notifications:', storedUser.id);
    }
  }, []);

  const updateMarkers = async (alsoUpdateRoute = false) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/devices/map', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = JSON.parse(localStorage.getItem('user'));
      const isClientUser = user?.role === 'client_user';

      const devices = (res.data.devices || []).filter(d =>
        d.latitude && d.longitude
      ).map(d => ({
        ...d,
        latitude: parseFloat(d.latitude),
        longitude: parseFloat(d.longitude)
      }));

      let fullDevices = [];
      if (isClientUser) {
        fullDevices = devices.filter(d => d.status === 'out_of_service');
        setAllDevices(fullDevices);
      } else {
        setAllDevices(devices);
        fullDevices = devices.filter(d => d.status === 'out_of_service');
      }
      setFullBins(fullDevices);

      if (alsoUpdateRoute && fullDevices.length > 0 && userLocation) {
        const response = await axios.post(
          'http://localhost:8000/api/devices/route',
          { start: { lat: userLocation[0], lng: userLocation[1] } },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRoute(response.data.route);
      } else if (alsoUpdateRoute) {
        setRoute(null);
      }
    } catch (err) {
      console.error('Cihazlar veya rota güncellenemedi:', err);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!userLocation) {
      toast.error('Konum alınamadı, lütfen konum izinlerini kontrol edin.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/devices/route',
        { start: { lat: userLocation[0], lng: userLocation[1] } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.devices || response.data.devices.length === 0) {
        toast.error('Toplanacak dolu çöp kutusu bulunamadı.');
        setRoute(null);
        return;
      }

      setRoute(response.data.route);

      if (mapRef.current) {
        const bounds = L.latLngBounds(
          response.data.devices.map(d => [d.latitude, d.longitude])
        );
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Rota oluşturulamadı:', err);
      toast.error('Rota oluşturulamadı.');
      setRoute(null);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [userLocation]);

  useEffect(() => {
    socket.on('notification', (data) => {
      if (data.unique_id && ['full', 'empty'].includes(data.type)) {
        updateMarkers(true);
        console.log('[📥] Notification received (will update markers and route):', data);
      }
    });

    return () => {
      socket.off('notification');
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
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full z-0"
          whenCreated={mapInstance => (mapRef.current = mapInstance)}
        >
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
          className={`px-4 py-2 rounded absolute bottom-4 right-4 z-[1000] shadow-lg 
            ${fullBins.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
          `}
          disabled={fullBins.length === 0}
          onClick={handleOptimizeRoute}
        >
          Çöp Topla
        </button>
      </div>
    </>
  );
}
