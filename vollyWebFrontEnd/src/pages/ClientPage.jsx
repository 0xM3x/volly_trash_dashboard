import Layout from '../components/Layout';
import AddClientModal from '../components/AddClientModal';
import { useState } from 'react';

export default function ClientPage() {
  const [clients, setClients] = useState([
    { id: 1, name: 'ABC Teknoloji', email: 'abc@example.com', status: 'Aktif' },
    { id: 2, name: 'Delta Şirketi', email: 'delta@example.com', status: 'Pasif' },
  ]);
  const [showModal, setShowModal] = useState(false);

  const handleAddClient = (newClient) => {
    setClients([...clients, newClient]);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600">Müşteriler</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Yeni Müşteri Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white shadow rounded-xl p-4 space-y-1">
              <h3 className="text-lg font-semibold text-blue-600">{client.name}</h3>
              <p className="text-sm text-gray-600">{client.email}</p>
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  client.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {client.status}
              </span>
            </div>
          ))}
        </div>

        {/* Modal */}
        <AddClientModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddClient}
        />
      </div>
    </Layout>
  );
}

