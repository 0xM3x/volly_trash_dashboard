import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiSettings,
  FiUser,
  FiCpu,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { MdCircle } from 'react-icons/md';
import { useEffect, useState } from 'react';

export default function Layout({ children }) {
  const navigate = useNavigate();

	const location = useLocation();
	const [expanded, setExpanded] = useState(false);

  const devices = [
    { id: 1, name: 'Cihaz 1', status: 'online' },
    { id: 2, name: 'Cihaz 2', status: 'offline' },
    { id: 3, name: 'Cihaz 3', status: 'online' },
  ];

	useEffect(() => {
    // Automatically expand if current route is a device page
    if (location.pathname.startsWith('/device')) {
      setExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div>
          <div className="p-6 text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FiCpu className="text-blue-600" />
            Akıllı Çöp
          </div>

          <nav className="mt-4 text-sm space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 px-6 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`
              }
            >
              <FiHome /> Panel
            </NavLink>

            {/* Cihazlar Sub-menu */}
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between py-2 px-6 hover:bg-blue-100 text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <FiCpu />
                  Cihazlar
                </span>
                {expanded ? (
                  <FiChevronUp className="text-sm" />
                ) : (
                  <FiChevronDown className="text-sm" />
                )}
              </button>
              {expanded && (
                <ul className="ml-8 mt-2 space-y-1">
                  {devices.map((device) => (
                    <li key={device.id}>
                      <NavLink
                        to={`/device/${device.id}`}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-2 py-1 rounded-md transition ${
                            isActive
                              ? 'text-blue-700 font-medium bg-blue-50'
                              : 'text-gray-700 hover:text-blue-600'
                          }`
                        }
                      >
                        <span>{device.name}</span>
                        <MdCircle
                          className={`text-xs ${
                            device.status === 'online'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        />
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 px-6 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`
              }
            >
              <FiSettings /> Ayarlar
            </NavLink>

            <NavLink
              to="/profile/1"
              className={({ isActive }) =>
                `flex items-center gap-2 py-2 px-6 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`
              }
            >
              <FiUser /> Profil
            </NavLink>
          </nav>
        </div>

        {/* Logout button fixed at the bottom */}
        <div className="mt-auto px-4 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition"
          >
            <FiLogOut className="text-lg" />
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

