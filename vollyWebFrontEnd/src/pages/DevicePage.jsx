import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import axios from '../utils/axiosInstance';
import { FaTemperatureHigh, FaTint, FaSmog } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LineChartCard from '../components/LineChartCard';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [sensorData, setSensorData] = useState({ gaz: 0, sicaklik: 0, nem: 0, doluluk: 0 });
  const [graphData, setGraphData] = useState({ gaz: [], sicaklik: [], nem: [], doluluk: [] });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [liveMode, setLiveMode] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/devices/${id}`)
      .then(res => setDeviceInfo(res.data))
      .catch(() => setError('Cihaz bilgisi alınamadı.'));
  }, [id]);

  useEffect(() => {
    if (!liveMode) return;

    const interval = setInterval(() => {
      const newData = {
        gaz: Math.floor(Math.random() * 40) + 60,
        sicaklik: Math.floor(Math.random() * 15) + 20,
        nem: Math.floor(Math.random() * 40) + 50,
        doluluk: Math.floor(Math.random() * 30) + 60,
      };

      const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setSensorData(newData);
      setGraphData(prev => ({
        gaz: [...prev.gaz.slice(-9), { time: now, value: newData.gaz }],
        sicaklik: [...prev.sicaklik.slice(-9), { time: now, value: newData.sicaklik }],
        nem: [...prev.nem.slice(-9), { time: now, value: newData.nem }],
        doluluk: [...prev.doluluk.slice(-9), { time: now, value: newData.doluluk }],
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [liveMode]);

  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setLiveMode(false);
    toast.success(`${date.toLocaleDateString('tr-TR')} için geçmiş veriler gösteriliyor`);
  };

  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!deviceInfo) return <div className="text-center text-gray-500 p-4">Cihaz bilgileri yükleniyor...</div>;

  const statusLabel = deviceInfo.status === 'online' ? 'Çevrim içi'
                    : deviceInfo.status === 'offline' ? 'Çevrim dışı'
                    : 'Bilinmiyor';
  const statusClass = deviceInfo.status === 'online' ? 'text-green-600 font-semibold'
                     : deviceInfo.status === 'offline' ? 'text-red-600 font-semibold'
                     : 'text-gray-600 font-semibold';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
          {/* Cihaz Bilgisi */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow p-6 h-full">
            <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Cihaz Bilgisi</h3>
            <ul className="space-y-4 text-base text-gray-900">
              <li className="flex justify-between"><span>Cihaz İsmi:</span> <span>{deviceInfo.name}</span></li>
              <li className="flex justify-between"><span>Unique ID:</span> <span>{deviceInfo.unique_id}</span></li>
              <li className="flex justify-between"><span>MAC Adresi:</span> <span>{deviceInfo.board_mac}</span></li>
              <li className="flex justify-between"><span>Durum:</span> <span className={statusClass}>{statusLabel}</span></li>
            </ul>
          </div>

          {/* Genel Durum */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow p-4 h-full">
            <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Genel Durum</h3>
            <ul className="space-y-4 text-base text-gray-900">
              <li className="flex justify-between"><span>Bugün Dolma Sayısı:</span> <span>3</span></li>
              <li className="flex justify-between"><span>Uyarı Sayısı:</span> <span>2</span></li>
              <li className="flex justify-between"><span>Bağlantı Kesilme:</span> <span>1</span></li>
            </ul>
          </div>

          {/* Takvim */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow p-6 h-full">
            <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Tarih Seç</h3>
            <div className="flex justify-center">
              <DayPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={tr} />
            </div>
          </div>
        </div>

        {/* Sensör Durumu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40">
              <CircularProgressbar
                value={sensorData.doluluk}
                text={`${sensorData.doluluk}%`}
                styles={buildStyles({
                  textColor: '#1e3a8a',
                  pathColor: '#3b82f6',
                  trailColor: '#e5e7eb',
                  textSize: '16px',
                  strokeLinecap: 'round',
                })}
              />
            </div>
            <div className="mt-4 text-sm font-medium text-gray-600">Doluluk Oranı</div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-green-100 text-green-800 rounded-xl shadow p-4 text-center">
              <FaSmog className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Gaz</div>
              <div className="text-2xl font-bold">{sensorData.gaz}%</div>
            </div>
            <div className="bg-red-100 text-red-800 rounded-xl shadow p-4 text-center">
              <FaTemperatureHigh className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Sıcaklık</div>
              <div className="text-2xl font-bold">{sensorData.sicaklik}°C</div>
            </div>
            <div className="bg-blue-100 text-blue-800 rounded-xl shadow p-4 text-center">
              <FaTint className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Nem</div>
              <div className="text-2xl font-bold">{sensorData.nem}%</div>
            </div>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartCard title="Gaz Grafiği" data={graphData.gaz} color="#16a34a" />
          <LineChartCard title="Sıcaklık Grafiği" data={graphData.sicaklik} color="#dc2626" />
          <LineChartCard title="Nem Grafiği" data={graphData.nem} color="#2563eb" />
          <LineChartCard title="Doluluk Grafiği" data={graphData.doluluk} color="#9333ea" />
        </div>
      </div>
    </Layout>
  );
}
