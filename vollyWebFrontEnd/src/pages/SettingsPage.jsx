import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import socket from '../utils/socket';

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role || '';
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Versiyon');
  const [users, setUsers] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const tabs = role === 'client_user'
    ? ['Versiyon']
    : ['Versiyon', 'Rol Yönetimi', 'Bildirimler'];

  useEffect(() => {
    if (user?.id) {
      socket.emit('join', user.id.toString());
    }
  }, [user?.id]);

  useEffect(() => {
    if (location.state?.openNotificationTab) {
      setActiveTab('Bildirimler');
    }
  }, [location.state]);

  useEffect(() => {
    if (role === 'admin') {
      axios.get('/users')
        .then(res => setUsers(res.data.users))
        .catch(() => console.warn('Kullanıcılar alınamadı'));

      axios.get('/clients')
        .then(res => setClientList(res.data.clients))
        .catch(() => console.warn('Firmalar alınamadı'));
    }

    if (role === 'client_admin') {
      axios.get('/users/by-client')
        .then(res => setUsers(res.data.users))
        .catch(() => console.warn('Kullanıcılar alınamadı'));
    }
  }, [role]);

  useEffect(() => {
    if (activeTab === 'Bildirimler' && role !== 'client_user') {
      axios.get('/notifications/devices')
        .then(res => setDevices(res.data))
        .catch(err => console.warn('Cihazlar alınamadı', err));

      axios.get('/notification-preferences')
        .then(res => setSelectedDevices(res.data.device_ids))
        .catch(err => console.warn('Tercihler alınamadı', err));

      axios.get('/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.warn('Bildirimler alınamadı', err));
    }
  }, [activeTab]);

  useEffect(() => {
    const relevantEvents = ['full', 'empty', 'press_active', 'gas_alert', 'door_open', 'window_open'];

    const eventMessages = {
      full: 'doldu',
      empty: 'boşaltıldı',
      press_active: 'presleme başladı',
      gas_alert: 'gaz seviyesi yüksek',
      door_open: 'kapak açıldı',
      window_open: 'pencere açıldı',
    };

    const handleNotification = (payload) => {
      if (
        payload &&
        relevantEvents.includes(payload.type) &&
        selectedDevices.includes(payload.unique_id)
      ) {
        const statusText = eventMessages[payload.type] || payload.type;
        toast.custom(() => (
          <div className="bg-white border-l-4 border-blue-600 shadow-lg px-4 py-2 rounded text-sm text-gray-800">
            🔔 Cihaz <strong>{payload.name || payload.unique_id}</strong> şu anda {statusText}.
          </div>
        ));
      }
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [selectedDevices]);

  const handleRoleChange = (userId, newRole, clientId) => {
    setEditedRoles(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        role: newRole,
        client_id: clientId,
      },
    }));
  };

  const handleSave = async (userId) => {
    const updates = editedRoles[userId];
    if (!updates) {
      toast.error('Lütfen değişiklik yapmadan kaydetmeyin.');
      return;
    }

    try {
      await axios.put(`/users/${userId}/role`, updates);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      setEditedRoles(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      toast.success('Rol başarıyla güncellendi');
    } catch (err) {
      console.error('Rol güncellenemedi', err);
      toast.error('Rol güncellenemedi');
    }
  };

  const toggleDevice = (deviceId) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSavePreferences = async () => {
    setLoadingSave(true);
    try {
      await axios.post('/notification-preferences', {
        device_ids: selectedDevices,
      });
      toast.success('Tercihler başarıyla kaydedildi');
    } catch (err) {
      toast.error('Tercihler kaydedilemedi');
      console.error(err);
    } finally {
      setLoadingSave(false);
    }
  };

  const formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        <div className="col-span-1 bg-white rounded-xl shadow-md p-6">
          <h1 className="text-xl font-semibold mb-4">Ayarlar</h1>
          <div className="space-y-3">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-md p-6">
          {activeTab === 'Versiyon' && (
            <div className="text-sm">
              <p className="mb-2">Panel Versiyonu: <strong>v1.0.0</strong></p>
              <p>Son Güncelleme: <strong>01.07.2025</strong></p>
            </div>
          )}

          {role !== 'client_user' && activeTab === 'Bildirimler' && (
            <div className="space-y-6 text-sm">
              <div className="space-y-4">
                <p className="text-gray-700">Bildirimi almak istediğiniz cihazları aşağıdan seçebilirsiniz.</p>

                {devices.length === 0 ? (
                  <p className="text-gray-400 italic">Yükleniyor...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {devices.map(device => (
                      <label key={device.unique_id} className="flex items-center gap-2 p-2 border rounded">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.unique_id)}
                          onChange={() => toggleDevice(device.unique_id)}
                          className="accent-blue-600"
                        />
                        <span>{device.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleSavePreferences}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
                    disabled={loadingSave}
                  >
                    {loadingSave ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <h2 className="text-base font-semibold mb-2">Tüm Bildirimler</h2>
                <ul className="divide-y text-sm">
                  {notifications.map(n => (
                    <li key={n.id} className="py-2">
                      <p className="text-gray-800">{n.message}</p>
                      <p className="text-gray-500 text-xs">{formatDate(n.created_at)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'Rol Yönetimi' && role !== 'client_user' && (
            <div className="space-y-4">
              {users
                .filter(u => role === 'admin' || u.client_id === user.client_id)
                .map(u => (
                  <div key={u.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium">{u.name} ({u.email})</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                      <select
                        value={editedRoles[u.id]?.role || u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value, editedRoles[u.id]?.client_id || u.client_id)}
                        className="border rounded px-2 py-1"
                      >
                        {role === 'admin' && (
                          <>
                            <option value="admin">Yönetici</option>
                            <option value="client_admin">Müşteri Yöneticisi</option>
                            <option value="client_user">Kullanıcı</option>
                          </>
                        )}
                        {role === 'client_admin' && (
                          <>
                            <option value="client_admin">Müşteri Yöneticisi</option>
                            <option value="client_user">Kullanıcı</option>
                          </>
                        )}
                      </select>

                      {role === 'admin' && (
                        <select
                          value={editedRoles[u.id]?.client_id || u.client_id || ''}
                          onChange={e => handleRoleChange(u.id, editedRoles[u.id]?.role || u.role, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Firma Yok</option>
                          {clientList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() => handleSave(u.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
