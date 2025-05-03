import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaTemperatureHigh, FaTint, FaSmog } from 'react-icons/fa';
import Layout from '../components/Layout';




export default function DeviceDetailPage() {
  const { id } = useParams();
  const deviceName = `Cihaz ${id}`;

	const [sensorData, setSensorData] = useState({
	  gaz: 72,
	  sicaklik: 31,
	  nem: 60,
	});
	
	useEffect(() => {
	  const interval = setInterval(() => {
	    setSensorData({
	      gaz: Math.floor(Math.random() * 40) + 60,       // 60–100%
	      sicaklik: Math.floor(Math.random() * 15) + 20,   // 20–35°C
	      nem: Math.floor(Math.random() * 40) + 50,        // 50–90%
	    });
	  }, 5000);
	
	  return () => clearInterval(interval);
	}, []);

  return (
		<Layout>
		  <div className="space-y-6">
		    {/* Top Row: Device Info (70%) + Dolma Count (30%) */}
		    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
		      {/* 70% */}
		      <div className="lg:col-span-7 bg-white rounded-xl shadow p-4">
		        <div className="text-xl font-bold">{deviceName}</div>
		        <div className="text-sm text-gray-600 mt-1">Bu cihaz hakkında kısa bilgi buraya gelecek...</div>
		      </div>
		
		      {/* 30% */}
		      <div className="lg:col-span-3 bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center">
		        <div className="text-sm font-medium text-gray-500 mb-1">Bugün Dolma Sayısı</div>
		        <div className="text-4xl font-bold text-blue-600">3</div>
		      </div>
		    </div>
		
		    {/* Middle Row: Capacity (50%) + Sensor Cards (50%) */}
		    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
		      {/* Doluluk Oranı */}
		      <div className="bg-white rounded-xl shadow p-4 text-center flex items-center justify-center min-h-[200px]">
		        Doluluk Oranı (Arc ya da Bar)
		      </div>
		
		      {/* Sensors Vertically */}
		      <div className="flex flex-col gap-4">
						{/* Gaz */}
						<div className="bg-green-100 text-green-800 rounded-xl shadow p-4 text-center">
						  <FaSmog className="text-2xl mx-auto mb-2" />
						  <div className="text-sm font-medium">Gaz</div>
						  <div className="text-2xl font-bold">{sensorData.gaz}%</div>
						</div>
						
						{/* Sıcaklık */}
						<div className="bg-red-100 text-red-800 rounded-xl shadow p-4 text-center">
						  <FaTemperatureHigh className="text-2xl mx-auto mb-2" />
						  <div className="text-sm font-medium">Sıcaklık</div>
						  <div className="text-2xl font-bold">{sensorData.sicaklik}°C</div>
						</div>
						
						{/* Nem */}
						<div className="bg-blue-100 text-blue-800 rounded-xl shadow p-4 text-center">
						  <FaTint className="text-2xl mx-auto mb-2" />
						  <div className="text-sm font-medium">Nem</div>
						  <div className="text-2xl font-bold">{sensorData.nem}%</div>
						</div>
						
		      </div>
		    </div>
		
		    {/* Bottom Row: 2x2 Graph Grid */}
		    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
		      <div className="bg-white rounded-xl shadow p-4">Gaz Grafiği</div>
		      <div className="bg-white rounded-xl shadow p-4">Sıcaklık Grafiği</div>
		      <div className="bg-white rounded-xl shadow p-4">Nem Grafiği</div>
		      <div className="bg-white rounded-xl shadow p-4">Doluluk Grafiği</div>
		    </div>
		  </div>
		</Layout>
  );
}

