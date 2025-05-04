import Layout from '../components/Layout';
import { FaUserCircle } from 'react-icons/fa';

export default function ProfilePage() {
  const user = {
    name: 'Ali Yılmaz',
    email: 'ali@firma.com',
    role: 'Firma',
    company: 'Volly Teknoloji A.Ş.',
    lastLogin: '04.05.2025 13:42',
    createdAt: '02.01.2025',
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-blue-900">Profil</h2>

        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar */}
					<div className="w-full md:w-[200px] flex justify-center items-center">
					  <FaUserCircle className="text-gray-400 text-[100px]" />
					</div>

          {/* User Info */}
          <div className="flex-1 text-sm text-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
              <div className="font-medium">Ad Soyad:</div>
              <div>{user.name}</div>

              <div className="font-medium">E-Posta:</div>
              <div>{user.email}</div>

              <div className="font-medium">Rol:</div>
              <div>{user.role}</div>

              <div className="font-medium">Firma:</div>
              <div>{user.company}</div>

              <div className="font-medium">Hesap Oluşturulma:</div>
              <div>{user.createdAt}</div>

              <div className="font-medium">Son Giriş:</div>
              <div>{user.lastLogin}</div>
            </div>

            <div className="mt-6">
              <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

