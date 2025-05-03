import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiSettings, FiUser, FiCpu, FiLogOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { MdCircle } from 'react-icons/md';
import { useState } from 'react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const devices = [
    { id: 1, name: 'Cihaz 1', status: 'online' },
    { id: 2, name: 'Cihaz 2', status: 'offline' },
    { id: 3, name: 'Cihaz 3', status: 'online' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between">
        <div>
          <div className="p-6 text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FiCpu className="text-blue-600" />
            Akıllı Çöp
          </div>

          <nav className="mt-4 text-sm space-y-2">
            <Link to="/" className="flex items-center gap-2 py-2 px-6 hover:bg-blue-100">
              <FiHome /> Panel
            </Link>

            {/* Cihazlar Sub-menu */}
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between py-2 px-6 hover:bg-blue-100"
              >
                <span className="flex items-center gap-2">
                  <FiCpu />
                  Cihazlar
                </span>
                <span>{expanded ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}</span>
              </button>
              {expanded && (
                <ul className="ml-8 mt-2 space-y-1">
                  {devices.map((device) => (
                    <li key={device.id}>
                      <Link
                        to={`/device/${device.id}`}
                        className="flex items-center justify-between px-2 py-1 text-gray-700 hover:text-blue-600"
                      >
                        <span>{device.name}</span>
                        <MdCircle className={`text-xs ${device.status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link to="/settings" className="flex items-center gap-2 py-2 px-6 hover:bg-blue-100">
              <FiSettings /> Ayarlar
            </Link>

            <Link to="/profile/1" className="flex items-center gap-2 py-2 px-6 hover:bg-blue-100">
              <FiUser /> Profil
            </Link>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-left w-full px-6 py-2 text-red-500 hover:bg-red-100"
        >
					<FiLogOut className="text-lg" />
		  		<span className="text-sm font-medium">Çıkış Yap</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

