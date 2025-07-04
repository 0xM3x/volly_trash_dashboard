import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import axios from '../utils/axiosInstance';

let storedUser = null;
try {
  storedUser = JSON.parse(localStorage.getItem('user')) || null;
} catch (error) {
  console.error('Stored user parse error:', error);
  storedUser = null;
}


export default function SettingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [notification, setNotification] = useState(null);
	const [companyName, setCompanyName] = useState('Volly Teknoloji A.Ş.');
	const [companyAddress, setCompanyAddress] = useState('İstanbul, Türkiye');
  const [users, setUsers] = useState([]);

  const handleSaveRole = () => {
   if (!selectedUser || !selectedRole) {
     toast.error('Lütfen kullanıcı ve rol seçin.');
     return;
   }

   axios.put(`/users/${selectedUser}/role`, { role: selectedRole })
     .then(() => {
       toast.success('Yetki başarıyla güncellendi.');
       setShowModal(false);
       setSelectedUser('');
       setSelectedRole('');
     })
     .catch(() => toast.error('Yetki güncelleme başarısız.'));
  };

  const handleCompanyUpdate = () => {
    if (!companyName) {
      toast.error('Firma adı gerekli');
      return;
    }
  
    axios.put(`/clients/${storedUser?.client_id}`, { name: companyName })
      .then(() => toast.success('Firma adı başarıyla güncellendi.'))
      .catch(() => toast.error('Güncelleme başarısız.'));
  };
  
  useEffect(() => {
    // Fetch Users (admin-only)
    if (storedUser?.role === 'admin') {
      axios.get('/users')
        .then(res => setUsers(res.data.users))
        .catch(() => toast.error('Kullanıcılar yüklenemedi.'));
    }
  
    // Fetch Company Info (admin or client_user)
    if (storedUser?.role === 'admin' || storedUser?.role === 'client_user') {
      axios.get(`/clients/${storedUser.client_id}`)
        .then(res => setCompanyName(res.data.name))
        .catch(() => toast.error('Firma bilgisi yüklenemedi.'));
    }
  }, []);


  return (
    <Layout>
      <div className="relative space-y-6 p-4">

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-md text-sm font-medium ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}


        {/* Yetki Yönetimi */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Yetki Yönetimi</h3>
          <p className="text-sm text-gray-600 mb-2">
            Kullanıcılara roller atayın veya erişim izinlerini yönetin.
          </p>
          <button
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            Yetkileri Düzenle
          </button>
        </div>

        {/* Firma Ayarları */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Firma Ayarları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Firma Adı</label>
							<input
							  type="text"
							  value={companyName}
							  onChange={(e) => setCompanyName(e.target.value)}
							  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition shadow-sm focus:outline-none"
							/>
            </div>
          </div>
					<button
					  onClick={handleCompanyUpdate}
					  className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
					>
					  Güncelle
					</button>

        </div>

        {/* Sistem Bilgileri */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistem Bilgileri</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li><strong>Uygulama Versiyonu:</strong> v1.0.0</li>
            <li><strong>Son Güncellenme:</strong> 04.05.2025</li>
            <li><strong>Aktif Kullanıcılar:</strong> 12</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Yetki Düzenle</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Seç</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition shadow-sm focus:outline-none"
              >
                <option value="">Seçiniz</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol Seç</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition shadow-sm focus:outline-none"
              >
                <option value="">Seçiniz</option>
                <option value="admin">Yönetici</option>
                <option value="client">Firma</option>
                <option value="user">Kullanıcı</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                İptal
              </button>
              <button
                onClick={handleSaveRole}
                className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

