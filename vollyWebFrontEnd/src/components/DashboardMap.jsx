import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';
import axios from '../utils/axiosInstance';
import { io } from 'socket.io-client';
import redMarkerIcon from '../assets/red-marker.png';
import greenMarkerIcon from '../assets/green-marker.png';
import yellowMarkerIcon from '../assets/yellow-marker.png';

// PNG marker icons for different statuses
const markerIcons = {
  online: new L.Icon({
    iconUrl: greenMarkerIcon,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
  }),
  offline: new L.Icon({
    iconUrl: redMarkerIcon,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
  }),
  out_of_service: new L.Icon({
    iconUrl: yellowMarkerIcon,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
  })
};

const socket = io('http://localhost:8000');

function FitBounds({ devices }) {
  const map = useMap();
  useEffect(() => {
    if (devices.length === 0) return;
    const bounds = L.latLngBounds(devices.map(d => [d.latitude, d.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [devices, map]);
  return null;
}

export default function DeviceMap() {
  const [devices, setDevices] = useState([]);

  const fetchDevices = async () => {
    try {
      const res = await axios.get('/devices/map');
      const enrichedDevices = res.data.devices.map(device => ({
        ...device,
        status: device.status || 'offline'
      }));
      setDevices(enrichedDevices);
    } catch (err) {
      console.error('Failed to load devices:', err.message);
    }
  };

  useEffect(() => {
    fetchDevices();

    const handleStatusUpdate = ({ unique_id, status }) => {
      setDevices(prev =>
        prev.map(device =>
          device.unique_id === unique_id ? { ...device, status } : device
        )
      );
    };

    socket.on('device-status-update', handleStatusUpdate);
    return () => socket.off('device-status-update', handleStatusUpdate);
  }, []);

  return (
    <MapContainer center={[39.92, 32.85]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <FitBounds devices={devices} />
      {devices.map((d, i) => (
        <Marker
          key={i}
          position={[d.latitude, d.longitude]}
          icon={markerIcons[d.status] || markerIcons.offline}
        >
          <Popup>
            <strong>{d.name || d.unique_id}</strong><br />
            Durum: {d.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
