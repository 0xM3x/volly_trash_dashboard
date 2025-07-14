import { useState } from 'react';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';

export default function AddClientModal({ isOpen, onClose, onAdd }) {
  const [clientName, setClientName] = useState('');
  const [users, setUsers] = useState([{ name: '', email: '', password: '', role: 'client_admin' }]);

  const handleUserChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const addUserField = () => {
    if (users[users.length - 1].name.trim() && users[users.length - 1].email.trim()) {
      setUsers([...users, { name: '', email: '', password: '', role: 'client_admin' }]);
    }
  };

  const removeUserField = (index) => {
    if (users.length === 1) return;
    const updated = users.filter((_, i) => i !== index);
    setUsers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Lütfen geçerli bir firma adı girin.');
      return;
    }

    try {
      // Step 1: Create Client
      const clientRes = await axios.post('/clients', { name: clientName.trim() });
      const clientId = clientRes.data.id;

      // Step 2: Register Users (optional)
      for (const user of users) {
        if (user.name.trim() && user.email.trim()) {
          await axios.post('/users', {
            name: user.name.trim(),
            email: user.email.trim(),
            password: user.password.trim(),
            role: user.role || 'client_user',
            client_id: clientId,
          });
        }
      }

      toast.success('Müşteri ve kullanıcılar başarıyla eklendi.');
      setClientName('');
      setUsers([{ name: '', email: '', password: '', role: 'client_admin' }]);
      onAdd(); // Refresh client list
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Ekleme başarısız.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/40 z-50 flex items-center justify-center px-4 overflow-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl space-y-6">
        <h3 className="text-lg font-bold text-blue-600">Yeni Müşteri Ekle</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Firma Adı</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Yetkililer</h4>
            <div className="space-y-4">
              {users.map((user, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      value={user.name}
                      onChange={(e) => handleUserChange(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    <input
                      type="email"
                      placeholder="E-posta"
                      value={user.email}
                      onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Şifre"
                      value={user.password}
                      onChange={(e) => handleUserChange(index, 'password', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    <select
                      value={user.role}
                      onChange={(e) => handleUserChange(index, 'role', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="client_admin">Müşteri Yöneticisi</option>
                      <option value="client_user">Kullanıcı</option>
                    </select>
                  </div>

                  {users.length > 1 && (
                    <div className="mt-2 text-right">
                      <button type="button" onClick={() => removeUserField(index)} className="text-sm text-red-600 hover:underline">
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addUserField}
              disabled={!users[users.length - 1].name.trim() || !users[users.length - 1].email.trim()}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              + Kullanıcı Ekle
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
              İptal
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
