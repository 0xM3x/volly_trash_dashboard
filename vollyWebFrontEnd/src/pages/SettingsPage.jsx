import Layout from '../components/Layout';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-blue-600">Ayarlar</h2>

        {/* Role Management */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Yetki Yönetimi</h3>
          <p className="text-sm text-gray-600 mb-2">
            Kullanıcılara roller atayın veya erişim izinlerini yönetin.
          </p>
          <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
            Yetkileri Düzenle
          </button>
        </div>

        {/* Company Settings */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Firma Ayarları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Firma Adı</label>
              <input
                type="text"
                defaultValue="Volly Teknoloji A.Ş."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Adres</label>
              <input
                type="text"
                defaultValue="İstanbul, Türkiye"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          <button className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
            Güncelle
          </button>
        </div>

        {/* System Info Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistem Bilgileri</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li><strong>Uygulama Versiyonu:</strong> v1.0.0</li>
            <li><strong>Son Güncellenme:</strong> 04.05.2025</li>
            <li><strong>Aktif Kullanıcılar:</strong> 12</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

