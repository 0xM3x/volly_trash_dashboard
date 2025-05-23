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
import { motion, AnimatePresence } from 'framer-motion';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');

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

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

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
        sicaklik: data.temperature ?? 0,
        nem: data.current ?? 0,
        doluluk: dolulukOrani
      });

      setGraphData(prev => ({
        gaz: [...prev.gaz.slice(-9), { time: now, value: data.gas ?? 0 }],
        sicaklik: [...prev.sicaklik.slice(-9), { time: now, value: data.temperature ?? 0 }],
        nem: [...prev.nem.slice(-9), { time: now, value: data.current ?? 0 }],
        doluluk: [...prev.doluluk.slice(-9), { time: now, value: dolulukOrani }]
      }));
    };

    socket.on('sensor-data', handleSensorData);
    return () => socket.off('sensor-data', handleSensorData);
  }, [liveMode, deviceInfo]);

  useEffect(() => {
    if (!deviceInfo || !selectedDate) return;

    if (isToday(selectedDate)) {
      setLiveMode(true);
      return;
    } else {
      setLiveMode(false);
    }

    const endDate = selectedDate.toISOString().split('T')[0];
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split('T')[0];

    axios.get(`/logs/${deviceInfo.unique_id}/range?start_date=${startStr}&end_date=${endDate}`)
      .then(res => {
        const logs = res.data;
        if (!logs.length) {
          toast.error('Seçilen tarihte veri bulunamadı');
          return;
        }

        const avg = (key) => Math.round(
          logs.reduce((acc, cur) => acc + Number(cur[key] ?? 0), 0) / logs.length
        );

        setSensorData({
          gaz: avg('gas'),
          sicaklik: parseFloat((logs.reduce((a, b) => a + b.temperature, 0) / logs.length).toFixed(1)),
          nem: avg('current'),
          doluluk: 0
        });

        const get7DayGraph = (key) => {
          const result = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            const label = date.toLocaleDateString('tr-TR');

            const dayLogs = logs.filter(log => {
              const logDate = new Date(log.timestamp);
              return (
                logDate.getFullYear() === date.getFullYear() &&
                logDate.getMonth() === date.getMonth() &&
                logDate.getDate() === date.getDate()
              );
            });

            const avg = dayLogs.length > 0
              ? dayLogs.reduce((acc, cur) => acc + Number(cur[key] ?? 0), 0) / dayLogs.length
              : 0;

            result.push({ time: label, value: parseFloat(avg.toFixed(1)) });
          }
          return result;
        };

        setGraphData({
          gaz: get7DayGraph('gas'),
          sicaklik: get7DayGraph('temperature'),
          nem: get7DayGraph('current'),
          doluluk: get7DayGraph('distance').map(d => ({
            time: d.time,
            value: mapDistanceToPercent(d.value)
          }))
        });
      })
      .catch(() => toast.error('Geçmiş veriler yüklenemedi'));
  }, [deviceInfo, selectedDate]);

  return (
    <Layout>
      <div className="space-y-6 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full bg-white rounded-xl shadow p-4 flex justify-between items-center">
  <div className="flex items-center gap-2">
    <button
      className="text-gray-500 hover:text-gray-700"
      onClick={() => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
        setDateKey(prev => prev + 1);
      }}>
      <FiChevronLeft size={22} />
    </button>
    <span className="text-gray-500 text-sm">
      {new Date(selectedDate.getTime() - 86400000).toLocaleDateString('tr-TR')}
    </span>
  </div>

  <button
    onClick={() => setShowCalendar(true)}
    className="text-blue-700 font-semibold hover:scale-105 transition transform transition-transform duration-300"
    key={selectedDate.toDateString()}
  >
    📅 {selectedDate.toLocaleDateString('tr-TR')}
  </button>

  <div className="flex items-center gap-2">
    <span className="text-gray-500 text-sm">
      {new Date(selectedDate.getTime() + 86400000).toLocaleDateString('tr-TR')}
    </span>
    <button
      className={`text-gray-500 hover:text-gray-700 ${isToday(selectedDate) ? 'opacity-30 pointer-events-none' : ''}`}
      onClick={() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate <= today) {
          setSelectedDate(nextDate);
          setDateKey(prev => prev + 1);
        }
      }}>
      <FiChevronRight size={22} />
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
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setShowCalendar(false);
              }
            }}
            locale={tr}
            toDate={new Date()}
          />
        </Dialog.Panel>
      </Transition.Child>
    </div>
  </Dialog>
</Transition>
          </motion.div>
        </AnimatePresence>

        {/* Sensor Info + Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
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
              <div className="text-2xl font-bold">{sensorData.sicaklik.toFixed(1)}°C</div>
            </div>
            <div className="bg-blue-100 text-blue-800 rounded-xl shadow p-4 text-center">
              <FaTint className="text-2xl mx-auto mb-2" />
              <div className="text-sm font-medium">Nem</div>
              <div className="text-2xl font-bold">{sensorData.nem}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <LineChartCard title="Gaz Grafiği" data={graphData.gaz} color="#16a34a" />
          <LineChartCard title="Sıcaklık Grafiği" data={graphData.sicaklik} color="#dc2626" />
          <LineChartCard title="Nem Grafiği" data={graphData.nem} color="#2563eb" />
          <LineChartCard title="Doluluk Grafiği" data={graphData.doluluk} color="#9333ea" />
        </div>
      </div>
    </Layout>
  );
}
