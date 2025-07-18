import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AddClientModal from '../components/AddClientModal';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';

export default function ClientPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyCode, setSelectedCompanyCode] = useState('');

  const fetchClients = () => {
    axios.get('/clients')
      .then(res => setClients(res.data.clients))
      .catch(() => toast.error('Müşteri listesi alınamadı.'));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = () => {
    fetchClients();
    setShowModal(false);
  };

  const uniqueCompanyCodes = [...new Set(clients.map(c => c.company_id))].sort((a, b) => parseInt(a, 16) - parseInt(b, 16));

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCode = selectedCompanyCode === '' || client.company_id === selectedCompanyCode;
    return matchesSearch && matchesCode;
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Search, Filter, and Button on the Same Line */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="İsim Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm w-full sm:w-64 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={selectedCompanyCode}
              onChange={(e) => setSelectedCompanyCode(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-md text-sm w-full sm:w-48 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tüm Firma Kodları</option>
              {uniqueCompanyCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:ml-auto">
            <button

              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm w-full sm:w-auto"
            >
              Yeni Müşteri Ekle
            </button>
          </div>
        </div>


        {/* Client List */}
        {filteredClients.length === 0 ? (
          <p className="text-gray-500">Hiç müşteri bulunamadı.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white shadow rounded-xl p-4 space-y-1">
                <h3 className="text-lg font-semibold text-blue-600">{client.name}</h3>
                <p className="text-sm text-gray-600">Firma Kodu: {client.company_id}</p>
                <p className="text-xs text-gray-400">Oluşturulma: {new Date(client.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            ))}
          </div>
        )}

        <AddClientModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddClient}
        />
      </div>
    </Layout>
  );
}
