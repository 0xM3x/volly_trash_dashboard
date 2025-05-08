import Layout from '../components/Layout';
import { FaUserCircle } from 'react-icons/fa';
import axios from '../utils/axiosInstance';
import { useEffect, useState  } from 'react';
import { set } from 'date-fns';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/users/me')
    .then((res) => setUserInfo(res.data))
    .catch(() => setError('bilgileri alınamadı.'));
  }, []);

  if (error) {
    return <div className='text-red-500 p-4 text-center'>{error}</div>;
  }
  
  if (!userInfo) {
    return <div className='text-gray-500 p-4 text-center'>Yükleniyor...</div>;
  }
  
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
              <div>{userInfo.name}</div>

              <div className="font-medium">E-Posta:</div>
              <div>{userInfo.email}</div>

              <div className="font-medium">Rol:</div>
              <div>{userInfo.role}</div>

              <div className="font-medium">Firma:</div>
              {/* <div>{userInfo.client_id}</div> */}
              <p>{userInfo.client_name || 'Yok'}</p>

              <div className="font-medium">Hesap Oluşturulma:</div>
              {/* <div>{userInfo.created_at}</div> */}
              {new Date(userInfo.created_at).toLocaleString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
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

