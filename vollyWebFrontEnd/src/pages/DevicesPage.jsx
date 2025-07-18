import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

export default function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', board_mac: '', client_id: '', latitude: '', longitude: '' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const fetchDevices = () => {
    setLoading(true);
    axios.get('/devices')
      .then(res => {
        setDevices(res.data.devices);
      })
      .catch(() => toast.error('Cihazlar yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  const fetchUserRole = () => {
    axios.get('/users/me')
      .then(res => {
        if (res.data.role === 'admin') setIsAdmin(true);
      })
      .catch(() => toast.error('Kullanıcı bilgisi alınamadı.'));
  };

  const fetchClients = () => {
    axios.get('/clients')
      .then(res => setClientList(res.data.clients))
      .catch(() => toast.error('Firmalar alınamadı.'));
  };

  useEffect(() => {
    fetchDevices();
    fetchUserRole();
    fetchClients();
  }, []);

  const filteredDevices = devices.filter(device => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      device.name.toLowerCase().includes(searchLower) ||
      device.board_mac.toLowerCase().includes(searchLower) ||
      device.unique_id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRegisterDevice = () => {
    if (!newDevice.name || !newDevice.board_mac || !newDevice.client_id) {
      toast.error('Tüm alanlar zorunludur');
      return;
    }

    axios.post('/devices', newDevice)
      .then(() => {
        toast.success('Cihaz eklendi');
        setShowModal(false);
        fetchDevices();
      })
      .catch(() => toast.error('Cihaz eklenemedi'));
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cihaz adı, MAC adresi veya benzersiz ID ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="online">Çevrimiçi</option>
              <option value="offline">Çevrimdışı</option>
            </select>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
            >
              + Cihaz Ekle
            </button>
          )}
        </div>

        {filteredDevices.length === 0 ? (
          <p className="text-gray-500">Cihaz bulunamadı.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map(device => (
              <div
                key={device.id}
                className="bg-white shadow rounded-xl p-4 space-y-1 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => navigate(`/device/${device.id}`)}
              >
                <h3 className="text-lg font-semibold text-blue-600">{device.name}</h3>
                <p className="text-sm text-gray-600">MAC: {device.board_mac}</p>
                <p className="text-sm text-gray-500">ID: {device.unique_id}</p>
                <p className={`inline-block mt-1 px-2 py-1 text-xs rounded
                  ${device.status === 'online' && 'bg-green-100 text-green-700'}
                  ${device.status === 'offline' && 'bg-red-100 text-red-600'}
                  ${device.status === 'out_of_service' && 'bg-yellow-100 text-yellow-800'}
                `}>
                  {device.status === 'online'
                    ? 'Çevrimiçi'
                    : device.status === 'out_of_service'
                    ? 'Servis Dışı'
                    : 'Çevrimdışı'}
                </p>

              </div>
            ))}
          </div>
        )}

        <Transition appear show={showModal} as={Fragment}>
          <Dialog as="div" className="relative z-[90]" onClose={() => setShowModal(false)}>
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                  <Dialog.Title className="text-lg font-semibold mb-4">Yeni Cihaz Ekle</Dialog.Title>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Cihaz Adı"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                    />
                    <input
                      type="text"
                      placeholder="Kart MAC Adresi"
                      value={newDevice.board_mac}
                      onChange={(e) => setNewDevice({ ...newDevice, board_mac: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                    />

                    <select
                      value={newDevice.client_id}
                      onChange={(e) => setNewDevice({ ...newDevice, client_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                    >
                      <option value="">Firma Seçin</option>
                      {clientList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    <div className="h-64">
                      <MapContainer center={[39.9208, 32.8541]} zoom={6} scrollWheelZoom={true} className="h-full w-full rounded">
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        />
                        <LocationPicker
                          onSelect={({ lat, lng }) => setNewDevice({ ...newDevice, latitude: lat.toFixed(6), longitude: lng.toFixed(6) })}
                        />
                        {newDevice.latitude && newDevice.longitude && (
                          <Marker
                            position={[parseFloat(newDevice.latitude), parseFloat(newDevice.longitude)]}
                            icon={markerIcon}
                          />
                        )}
                      </MapContainer>
                    </div>

                    {newDevice.latitude && newDevice.longitude && (
                      <p className="text-sm text-gray-600 mt-2">Konum: {newDevice.latitude}, {newDevice.longitude}</p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={handleRegisterDevice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Kaydet
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </Layout>
  );
}
