import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaTemperatureHigh, FaTint, FaSmog } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LineChartCard from '../components/LineChartCard';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


import Layout from '../components/Layout';




export default function DeviceDetailPage() {
  const { id } = useParams();
  const deviceName = `Cihaz ${id}`;

	const [sensorData, setSensorData] = useState({
	  gaz: 72,
	  sicaklik: 31,
	  nem: 60,
		doluluk: 66,
	});
	const [graphData, setGraphData] = useState({
 		gaz: [],
  	sicaklik: [],
  	nem: [],
  	doluluk: [],
	});
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [liveMode, setLiveMode] = useState(true);

	useEffect(() => {
	  if (!liveMode) return;
	
	  const interval = setInterval(() => {
	    const newData = {
	      gaz: Math.floor(Math.random() * 40) + 60,
	      sicaklik: Math.floor(Math.random() * 15) + 20,
	      nem: Math.floor(Math.random() * 40) + 50,
	      doluluk: Math.floor(Math.random() * 30) + 60,
	    };
	
	    const now = new Date().toLocaleTimeString('tr-TR', {
	      hour: '2-digit',
	      minute: '2-digit',
	      second: '2-digit',
	    });
	
	    setSensorData(newData);
	
	    setGraphData((prevData) => ({
	      gaz: [...prevData.gaz.slice(-9), { time: now, value: newData.gaz }],
	      sicaklik: [...prevData.sicaklik.slice(-9), { time: now, value: newData.sicaklik }],
	      nem: [...prevData.nem.slice(-9), { time: now, value: newData.nem }],
	      doluluk: [...prevData.doluluk.slice(-9), { time: now, value: newData.doluluk }],
	    }));
	  }, 5000);
	
	  return () => clearInterval(interval);
	}, [liveMode]);

	
//	useEffect(() => {
//	  const interval = setInterval(() => {
//	    setSensorData({
//	      gaz: Math.floor(Math.random() * 40) + 60,       // 60–100%
//	      sicaklik: Math.floor(Math.random() * 15) + 20,   // 20–35°C
//	      nem: Math.floor(Math.random() * 40) + 50,        // 50–90%
//				doluluk: Math.floor(Math.random() * 30) + 60       // 60–90%
//	    });
//	  }, 1000);
//	
//	  return () => clearInterval(interval);
//	}, []);

  return (
		<Layout>
		  <div className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
				  {/* Cihaz Bilgisi */}
				  <div className="lg:col-span-7 bg-white rounded-xl shadow p-4">
				    <div className="text-xl font-bold">{deviceName}</div>
				    <div className="text-sm text-gray-600 mt-1">Bu cihaz hakkında kısa bilgi buraya gelecek...</div>
				  </div>
				
				  {/* Tarih ve Dolma Sayısı (stacked) */}
				  <div className="lg:col-span-3 flex flex-col gap-4">
				    {/* Tarih Seç */}
				    <div className="bg-white rounded-xl shadow p-4">
				      <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Seç</label>
				      <DatePicker
				        selected={selectedDate}
								onChange={(date) => {
								  setSelectedDate(date);
								  setLiveMode(false); // stop live updates
								
								  // Simulated static data
								  const newData = {
								    gaz: 65,
								    sicaklik: 28,
								    nem: 55,
								    doluluk: 75,
								  };
								
								  const fakeGraph = Array.from({ length: 10 }).map((_, i) => ({
								    time: `${i + 1}:00`,
								    value: newData.gaz + Math.floor(Math.random() * 5),
								  }));
								
								  setSensorData(newData);
								  setGraphData({
								    gaz: fakeGraph,
								    sicaklik: fakeGraph.map((d) => ({ ...d, value: newData.sicaklik + Math.floor(Math.random() * 2) })),
								    nem: fakeGraph.map((d) => ({ ...d, value: newData.nem + Math.floor(Math.random() * 4) })),
								    doluluk: fakeGraph.map((d) => ({ ...d, value: newData.doluluk + Math.floor(Math.random() * 3) })),
								  });
								
								  console.log('Seçilen tarih:', date.toLocaleDateString('tr-TR'));
								}}

				        dateFormat="dd.MM.yyyy"
				        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200 text-sm"
				        locale="tr"
				      />
				    </div>
				
				    {/* Bugün kaç kez doldu */}
				    <div className="bg-white rounded-xl shadow p-4 text-center flex flex-col justify-center">
				      <div className="text-sm font-medium text-gray-500 mb-1">Bugün Dolma Sayısı</div>
				      <div className="text-4xl font-bold text-blue-600">3</div>
				    </div>
				  </div>
				</div>
		
		    {/* Middle Row: Capacity (50%) + Sensor Cards (50%) */}
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
		
		    {/* Chart Grid */}
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

