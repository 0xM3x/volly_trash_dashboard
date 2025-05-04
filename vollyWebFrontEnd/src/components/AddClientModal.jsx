import { useState } from 'react';

export default function AddClientModal({ isOpen, onClose, onAdd }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [users, setUsers] = useState([{ name: '', email: '', role: 'Kullanıcı' }]);

  const handleUserChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const addUserField = () => {
    if (users[users.length - 1].name.trim() && users[users.length - 1].email.trim()) {
      setUsers([...users, { name: '', email: '', role: 'Kullanıcı' }]);
    }
  };

	const removeUserField = (index) => {
	  if (users.length === 1) return; // Prevent removing the last remaining user
	  const updated = users.filter((_, i) => i !== index);
	  setUsers(updated);
	};
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;

    onAdd({
      id: Date.now(),
      name: clientName,
      email: clientEmail,
      status: 'Aktif',
      users,
    });

    // Reset and close
    setClientName('');
    setClientEmail('');
    setUsers([{ name: '', email: '', role: 'Kullanıcı' }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4 overflow-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl space-y-6">
        <h3 className="text-lg font-bold text-blue-900">Yeni Müşteri Ekle</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-gray-600 mb-1">Firma E-posta</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Yetkililer Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Yetkililer</h4>
            <div className="space-y-4">
              {users.map((user, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm relative"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    <select
                      value={user.role}
                      onChange={(e) => handleUserChange(index, 'role', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Yönetici">Yönetici</option>
                      <option value="Kullanıcı">Kullanıcı</option>
                    </select>
                  </div>

                  {users.length > 1 && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeUserField(index)}
                        className="text-sm text-red-600 hover:underline"
                      >
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
              disabled={
                users[users.length - 1].name.trim() === '' ||
                users[users.length - 1].email.trim() === ''
              }
              className={`mt-3 text-sm font-medium ${
                users[users.length - 1].name.trim() && users[users.length - 1].email.trim()
                  ? 'text-blue-600 hover:underline'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              + Kullanıcı Ekle
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

