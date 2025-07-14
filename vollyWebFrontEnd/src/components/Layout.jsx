import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiSettings,
  FiUser,
  FiCpu,
  FiLogOut,
} from 'react-icons/fi';
import { useEffect, useState } from 'react';
import axios from '../utils/axiosInstance';
import TopBar from './TopBar';
import socket from '../utils/socket';
import { toast } from 'react-hot-toast';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [devices, setDevices] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role;

  useEffect(() => {
    axios.get('/devices')
      .then(res => setDevices(res.data.devices))
      .catch(() => toast.error('Cihazlar yüklenemedi.'));
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/device')) {
      setExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    if (user?.id) {
      socket.emit('register', user.id.toString());
    }
  }, [user?.id]);

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
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isAdmin = currentUser?.role === 'admin';

      if (!payload || !relevantEvents.includes(payload.type)) return;
      if (!isAdmin && payload.client_id !== currentUser?.client_id) return;

      const eventText = eventMessages[payload.type] || payload.type;
      const deviceName = payload.name || `Cihaz ${payload.unique_id}`;

      toast.custom(() => (
        <div className="bg-white border-l-4 border-blue-600 shadow-lg px-4 py-2 rounded text-sm text-gray-800">
          🔔 <strong>{deviceName}</strong> şu anda <strong>{eventText}</strong>.
        </div>
      ));
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div>
          <div className="p-6 text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FiCpu className="text-blue-600" />
            Akıllı Çöp
          </div>

          <nav className="mt-4 text-sm space-y-2">
            <NavLink to="/" className={navLinkStyle}><FiHome /> Panel</NavLink>
            <NavLink to="/devices" className={navLinkStyle}><FiCpu /> Cihazlar</NavLink>

            {role === 'admin' && (
              <NavLink to="/clients" className={navLinkStyle}><FiUser /> Müşteriler</NavLink>
            )}

            <NavLink to="/settings" className={navLinkStyle}><FiSettings /> Ayarlar</NavLink>
            <NavLink to={`/profile/${user?.id}`} className={navLinkStyle}><FiUser /> Profil</NavLink>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <TopBar />
        <div className="p-6 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

const navLinkStyle = ({ isActive }) =>
  `flex items-center gap-2 py-2 px-6 rounded-lg transition ${
    isActive
      ? 'bg-blue-100 text-blue-700 font-semibold'
      : 'text-gray-700 hover:bg-blue-100'
  }`;
