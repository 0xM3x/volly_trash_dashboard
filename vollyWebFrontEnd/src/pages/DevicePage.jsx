import { useParams } from 'react-router-dom';
import { useEffect, useState, Fragment } from 'react';
import Layout from '../components/Layout';
import axios from '../utils/axiosInstance';
import { FaTemperatureHigh, FaTint, FaSmog } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LineChartCard from '../components/LineChartCard';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Dialog, Transition } from '@headlessui/react';

const socket = io('http://localhost:8000');

export default function DeviceDetailPage() {
  const { id } = useParams();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [sensorData, setSensorData] = useState({ gaz: 0, sicaklik: 0, nem: 0, doluluk: 0 });
  const [graphData, setGraphData] = useState({ gaz: [], sicaklik: [], nem: [], doluluk: [] });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [liveMode, setLiveMode] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  const [dateKey, setDateKey] = useState(0);

  useEffect(() => {
    axios.get(`/devices/${id}`)
      .then(res => setDeviceInfo(res.data))
      .catch(() => setError('Cihaz bilgisi alınamadı.'));
  }, [id]);

  const mapDistanceToPercent = (distance) => {
    const max = 85;
    const min = 25;
    if (distance <= min) return 100;
    if (distance >= max) return 0;
    return Math.round(((max - distance) / (max - min)) * 100);
  };

  useEffect(() => {
    if (!liveMode || !deviceInfo) return;

    const handleSensorData = (data) => {
      if (data.id !== deviceInfo.unique_id) return;

      const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dolulukOrani = mapDistanceToPercent(data.distance ?? 100);

      setSensorData({
        gaz: data.gas ?? 0,
        sicaklik: data.temperature?? 0,
        nem: data.current ?? 0,
        doluluk: dolulukOrani
      });

      setGraphData(prev => ({
        gaz: [...prev.gaz.slice(-9), { time: now, value: data.gas ?? 0 }],
        sicaklik: [...prev.sicaklik.slice(-9), { time: now, value: data.temperature ?? 0 }],
        nem: [...prev.nem.slice(-9), { time: now, value: data.current?? 0 }],
        doluluk: [...prev.doluluk.slice(-9), { time: now, value: dolulukOrani }]
      }));
    };

    socket.on('sensor-data', handleSensorData);
    return () => socket.off('sensor-data', handleSensorData);
  }, [liveMode, deviceInfo]);

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
    setLiveMode(false);
    setDateKey(prev => prev + 1);
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setLiveMode(false);
    setShowCalendar(false);
    toast.success(`${date.toLocaleDateString('tr-TR')} için geçmiş veriler gösteriliyor`);
  };

  const formatDate = (offset) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  const statusLabel = deviceInfo?.status === 'online' ? 'Çevrim içi'
    : deviceInfo?.status === 'offline' ? 'Çevrim dışı'
    : 'Bilinmiyor';
  const statusClass = deviceInfo?.status === 'online' ? 'text-green-600 font-semibold'
    : deviceInfo?.status === 'offline' ? 'text-red-600 font-semibold'
    : 'text-gray-600 font-semibold';

  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!deviceInfo) return <div className="text-center text-gray-500 p-4">Cihaz bilgileri yükleniyor...</div>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="w-full bg-white rounded-xl shadow p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="text-gray-500 hover:text-gray-700" onClick={() => handleDateChange(-1)}>
              <FiChevronLeft size={24} />
            </button>
            <div className="ml-2 text-gray-500 text-lg">{formatDate(-1)}</div>
          </div>

          <Transition
            show={true}
            appear
            key={dateKey}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <button onClick={() => setShowCalendar(true)} className="font-semibold text-blue-600 hover:text-blue-800 transition">
              📅 {selectedDate.toLocaleDateString('tr-TR')}
            </button>
          </Transition>

          <div className="flex items-center gap-2">
            <div className="mr-2 text-gray-500 text-lg">{formatDate(1)}</div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => handleDateChange(1)}>
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>

        <Transition appear show={showCalendar} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowCalendar(false)}>
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6">
                  <DayPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={tr} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6 h-full">
            <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Cihaz Bilgisi</h3>
            <ul className="space-y-4 text-base text-gray-900">
              <li className="flex justify-between"><span>Cihaz İsmi:</span> <span>{deviceInfo.name}</span></li>
              <li className="flex justify-between"><span>Unique ID:</span> <span>{deviceInfo.unique_id}</span></li>
              <li className="flex justify-between"><span>MAC Adresi:</span> <span>{deviceInfo.board_mac}</span></li>
              <li className="flex justify-between"><span>Durum:</span> <span className={statusClass}>{statusLabel}</span></li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow p-4 h-full">
            <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Genel Durum</h3>
            <ul className="space-y-4 text-base text-gray-900">
              <li className="flex justify-between"><span>Bugün Dolma Sayısı:</span> <span>3</span></li>
              <li className="flex justify-between"><span>Uyarı Sayısı:</span> <span>2</span></li>
              <li className="flex justify-between"><span>Bağlantı Kesilme:</span> <span>1</span></li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40">
              <CircularProgressbar
                value={typeof sensorData.doluluk === 'number' ? sensorData.doluluk : 0}
                text={typeof sensorData.doluluk === 'number' ? `${sensorData.doluluk}%` : 'Yok'}
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
              <div className="text-2xl font-bold">{typeof sensorData.gaz === 'number' ? `${sensorData.gaz}%` : 'Yok'}</div>
            </div>
            <div className="bg-red-100 text-red-800 rounded-xl shadow p-4 text-center">
              <FaTemperatureHigh className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Sıcaklık</div>
              <div className="text-2xl font-bold">{typeof sensorData.sicaklik === 'number' ? `${sensorData.sicaklik}°C` : 'Yok'}</div>
            </div>
            <div className="bg-blue-100 text-blue-800 rounded-xl shadow p-4 text-center">
              <FaTint className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Nem</div>
              <div className="text-2xl font-bold">{typeof sensorData.nem === 'number' ? `${sensorData.nem}%` : 'Yok'}</div>
            </div>
          </div>
        </div>

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