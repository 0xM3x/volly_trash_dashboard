import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import Chart from 'react-apexcharts';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiCpu, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { io } from 'socket.io-client';
import DashboardMap from '../components/DashboardMap';


const socket = io('http://localhost:8000');

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, outOfService: 0 });
  const [chartData, setChartData] = useState({ days: [], counts: [], mostFilled: null, leastFilled: null });
  const [capacityData, setCapacityData] = useState([]);
  const capacityRef = useRef([]);

  const mapDistanceToPercent = (distance) => {
    const max = 85;
    const min = 25;
    if (distance <= min) return 100;
    if (distance >= max) return 0;
    return Math.round(((max - distance) / (max - min)) * 100);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/stats/summary');
      setStats(res.data);
    } catch {
      toast.error('Özet veriler alınamadı');
    }
  };

  const fetchChartAndCapacity = async () => {
    try {
      const [chartRes, capacityRes] = await Promise.all([
        axios.get('/stats/fill-graph'),
        axios.get('/stats/latest-status'),
      ]);
      setChartData(chartRes.data);
      const mapped = capacityRes.data.map(device => ({
        ...device,
        percent: mapDistanceToPercent(device.distance ?? 100),
      }));
      capacityRef.current = mapped;
      setCapacityData(mapped);
    } catch {
      toast.error('Grafik veya cihaz verisi alınamadı');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchChartAndCapacity();
  }, []);

  useEffect(() => {
    const handleSensorData = (data) => {
      const updated = capacityRef.current.map((device) => {
        if (device.unique_id?.toString() === data.id?.toString()) {
          return {
            ...device,
            distance: data.distance,
            percent: mapDistanceToPercent(data.distance ?? 100),
          };
        }
        return device;
      });
      capacityRef.current = updated;
      setCapacityData([...updated]);
    };

    const handleNotification = ({ type }) => {
      if (['full', 'empty', 'gas_alert', 'gas_ok'].includes(type)) {
        fetchStats();
      }
    };

    const handleDeviceStatusUpdate = () => {
      fetchStats(); // Real-time card update
    };

    socket.on('sensor-data', handleSensorData);
    socket.on('notification', handleNotification);
    socket.on('device-status-update', handleDeviceStatusUpdate);

    return () => {
      socket.off('sensor-data', handleSensorData);
      socket.off('notification', handleNotification);
      socket.off('device-status-update', handleDeviceStatusUpdate);
    };
  }, []);

  const cards = [
    {
      label: 'Toplam Cihaz',
      value: stats.total,
      icon: <FiCpu className="text-blue-500 text-2xl" />,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Çevrimiçi Cihazlar',
      value: stats.online,
      icon: <FiCheckCircle className="text-green-500 text-2xl" />,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Çevrimdışı Cihazlar',
      value: stats.offline,
      icon: <FiXCircle className="text-red-500 text-2xl" />,
      color: 'bg-red-100 text-red-700',
    },
    {
      label: 'Servis Dışı Cihazlar',
      value: stats.outOfService,
      icon: <FiAlertTriangle className="text-yellow-500 text-2xl" />,
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
  <Layout>
    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className={`rounded-xl p-4 shadow-md ${card.color}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium">{card.label}</p>
              <p className="text-xl sm:text-2xl font-semibold">{card.value}</p>
            </div>
            <div className="text-lg sm:text-xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Map Section */}
    <div className="w-full h-[300px] sm:h-[500px] mb-6 rounded-xl shadow relative z-0 overflow-visible">
      <DashboardMap />
    </div>

    {/* Capacity Section */}
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Cihaz Doluluk Durumu</h2>
      {capacityData.length === 0 ? (
        <p className="text-sm">Cihaz verisi bulunamadı.</p>
      ) : (
        <div className="space-y-4">
          {capacityData.map((device) => (
            <div
              key={device.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <p className="font-medium text-sm sm:text-base w-full sm:w-1/3">
                {device.name || device.unique_id}
              </p>
              <div className="relative w-full sm:w-2/3 bg-gray-200 rounded-full h-5 overflow-hidden">
                <div
                  className="bg-green-500 h-5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${device.percent}%` }}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-gray-600">
                  {device.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </Layout>
);

}
