import Layout from '../components/Layout';
import { FaUserCircle } from 'react-icons/fa';
import axios from '../utils/axiosInstance';
import { useEffect, useState  } from 'react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    axios.get('/users/me')
    .then((res) => setUserInfo(res.data))
    .catch(() => setError('bilgileri alınamadı.'));
  }, []);


  const handlePasswordChange = () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    axios.put('/users/change-password', { oldPassword, newPassword })
      .then(() => {
        toast.success('Şifre başarıyla güncellendi');
        setShowModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Şifre güncellenemedi';
        toast.error(msg);
      });
  };

  if (error) {
    return <div className='text-red-500 p-4 text-center'>{error}</div>;
  }
  
  if (!userInfo) {
    return <div className='text-gray-500 p-4 text-center'>Yükleniyor...</div>;
  }
  
  return (
    <Layout>
      <div className="p-6 space-y-6">

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
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
              >
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-800">Şifreyi Güncelle</h3>
              <input type="password" placeholder="Eski Şifre" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              <input type="password" placeholder="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              <input type="password" placeholder="Yeni Şifre (Tekrar)" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-500 focus:text-white transition">İptal</button>
                <button onClick={handlePasswordChange} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

