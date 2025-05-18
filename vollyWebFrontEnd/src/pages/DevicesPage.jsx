import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';

export default function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchDevices = () => {
    axios.get('/devices')
      .then(res => setDevices(res.data.devices))
      .catch(() => toast.error('Cihazlar yüklenemedi.'));
  };

  useEffect(() => {
    fetchDevices();
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Cihazlar</h2>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Cihaz adı, MAC adresi veya benzersiz ID ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="online">Çevrimiçi</option>
            <option value="offline">Çevrimdışı</option>
          </select>
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
                <p className={`inline-block mt-1 px-2 py-1 text-xs rounded ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
