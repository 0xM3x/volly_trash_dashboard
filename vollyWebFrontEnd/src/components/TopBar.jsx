import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import io from 'socket.io-client';
import {
  FiUser,
  FiLogOut,
  FiShield,
  FiHome,
  FiBell,
  FiChevronDown,
  FiSettings,
  FiInfo
} from 'react-icons/fi';

const socket = io('http://localhost:8000');

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [user, setUser] = useState({});
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const modalRef = useRef(null);
  const prevNotifOpen = useRef(notifOpen);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      socket.emit('register', storedUser.id);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data);
        // setHasUnread(res.data.some((n) => !n.is_read));
        const unreadCount = res.data.filter(n => !n.is_read).length;
        setHasUnread(unreadCount > 0);
      } catch (err) {
        console.error('Bildirimler alınamadı:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    socket.on('notification', (newNotif) => {
      if (newNotif.user_id !== user.id) return;
      setNotifications(prev => {
        const exists = prev.some(
          n => n.message === newNotif.message && n.created_at === newNotif.created_at
        );
        return exists ? prev : [newNotif, ...prev];
      });
      setHasUnread(true);
    });

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (showAll && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowAll(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socket.off('notification');
    };
  }, [user, showAll]);

  useEffect(() => {
    if (prevNotifOpen.current && !notifOpen && hasUnread) {
      axios.post('/notifications/mark-read')
        .then(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setHasUnread(false);
        })
        .catch((err) => console.error('Bildirimler güncellenemedi:', err));
    }
    prevNotifOpen.current = notifOpen;
  }, [notifOpen, hasUnread]);

  const roleLabel = {
    admin: 'Yönetici',
    client_admin: 'Müşteri Yöneticisi',
    client_user: 'Kullanıcı',
  }[user.role] || 'Bilinmiyor';

  const pageTitle = {
    '/': 'Ana Sayfa',
    '/dashboard': 'Dashboard',
    '/devices': 'Cihazlar',
  }[location.pathname] || 'Uygulama';

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'K';
    return name
      .split(' ')
      .map((part) => part[0].toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleNotificationClick = () => {
    setNotifOpen(prev => !prev);
  };

  return (
    <>
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">{pageTitle}</h1>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleNotificationClick}
              className="relative text-gray-500 hover:text-blue-600"
            >
              <FiBell className="text-xl" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 text-sm overflow-hidden ring-1 ring-gray-200">
                <div className="px-4 py-3 font-semibold bg-gray-50 text-gray-700 border-b border-gray-100">
                  Bildirimler
                </div>
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notifications.filter(n => !n.is_read).length > 0 ? (
                    notifications.filter(n => !n.is_read).map((note, idx) => (
                      <li
                        key={idx}
                        className="px-4 py-3 cursor-pointer text-gray-700 hover:bg-blue-50 font-semibold"
                      >
                        • {note.message}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-gray-500">Yeni bildirim yok</li>
                  )}
                </ul>
                <div
                  onClick={() => setShowAll(true)}
                  className="px-4 py-2 text-center text-sm text-blue-600 hover:scale-105 transition-transform cursor-pointer"
                >
                  Tüm Bildirimleri Gör
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700"
            >
              <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {getInitials(user.name)}
              </div>
              <span>{user.name || 'Kullanıcı'}</span>
              <FiChevronDown className="text-xs" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 text-sm overflow-hidden ring-1 ring-gray-200">
                <div className="px-4 py-3 bg-gray-50">
                  <p className="font-semibold flex items-center gap-2 text-blue-700">
                    <FiUser /> {user.name}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <FiShield /> {roleLabel}
                  </p>
                  {user.role !== 'admin' && (
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <FiHome /> Firma: {user.client_id || 'Bilinmiyor'}
                    </p>
                  )}
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  <button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiInfo /> Profilim
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiSettings /> Ayarlar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiLogOut /> Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white w-[90vw] max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl p-0 overflow-y-auto">
            <h2 className="text-lg font-semibold text-blue-700 px-6 py-4 border-b border-gray-200 text-center sticky top-0 bg-white z-10">Tüm Bildirimler</h2>
            <ul className="w-full">
              {notifications.map((note, idx) => (
                <li
                  key={idx}
                  className={`w-full text-sm text-gray-700 px-6 py-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{note.message}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(note.created_at).toLocaleString('tr-TR')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
