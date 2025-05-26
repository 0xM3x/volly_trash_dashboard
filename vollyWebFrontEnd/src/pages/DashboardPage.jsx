import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import Chart from 'react-apexcharts';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FiCpu, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { io } from 'socket.io-client';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes, capacityRes] = await Promise.all([
          axios.get('/stats/summary'),
          axios.get('/stats/fill-graph'),
          axios.get('/stats/latest-status'),
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data);
        setCapacityData(capacityRes.data.map(device => ({
          ...device,
          percent: mapDistanceToPercent(device.distance ?? 100),
        })));
        capacityRef.current = capacityRes.data;
      } catch (error) {
        toast.error('Veriler alınırken bir hata oluştu');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleSensorData = (data) => {
      const updated = capacityRef.current.map((device) => {
        if (device.unique_id === data.id) {
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

    socket.on('sensor-data', handleSensorData);
    return () => {
      socket.off('sensor-data', handleSensorData);
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className={`rounded-xl p-4 shadow-md ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{card.label}</p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </div>
              <div>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 mb-6">
        <div className="col-span-1 xl:col-span-7 bg-white p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Doluluk Grafiği</h2>
          <Chart
            options={{
              chart: { id: 'fill-graph' },
              xaxis: { categories: chartData.days },
            }}
            series={[{ name: 'Doluluk', data: chartData.counts }]}
            type="bar"
            height={300}
          />
        </div>
				<div className="col-span-1 xl:col-span-3 flex flex-col gap-4 h-full">
          <div className="bg-sky-100 text-sky-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="text-sm font-medium">Bu Hafta En Çok Dolu Olan Cihaz</div>
            <div className="text-xl font-bold mt-2">{chartData.mostFilled?.name || 'Yok'}</div>
            <div className="text-xs mt-1">Toplam {chartData.mostFilled?.count || 0} kez doldu</div>
          </div>
          <div className="bg-rose-100 text-rose-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="text-sm font-medium">Bu Hafta En Az Dolu Olan Cihaz</div>
            <div className="text-xl font-bold mt-2">{chartData.leastFilled?.name || 'Yok'}</div>
            <div className="text-xs mt-1">Toplam {chartData.leastFilled?.count || 0} kez doldu</div>
          </div>
        </div> 
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Cihaz Doluluk Durumu</h2>
        {capacityData.length === 0 ? (
          <p>Cihaz verisi bulunamadı.</p>
        ) : (
          <div className="space-y-4">
            {capacityData.map((device, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="font-medium w-full md:w-1/3">{device.name || device.unique_id}</p>
                <div className="relative w-full md:w-2/3 bg-gray-200 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-green-500 h-5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${device.percent}%` }}
                  />
                  <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-semibold ${device.percent >= 96 ? 'text-white' : 'text-black'}`}>
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
