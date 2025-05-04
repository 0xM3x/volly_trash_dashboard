import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaTemperatureHigh, FaTint, FaSmog } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LineChartCard from '../components/LineChartCard';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { tr } from 'date-fns/locale';


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

	const handleDateSelect = (date) => {
	  if (!date) return;
	
	  setSelectedDate(date);
	  setLiveMode(false);
	
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
	};


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

  return (
		<Layout>
		  <div className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
				  {/* Cihaz Bilgisi */}
					<div className="lg:col-span-4 bg-white rounded-xl shadow p-6 h-full">
					  <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Cihaz Bilgisi</h3>
					  <ul className="space-y-4 text-base text-gray-900">
					    <li className="flex justify-between">
					      <span className="font-medium">Cihaz ID:</span>
					      <span className="text-gray-700">device-{id}</span>
					    </li>
					    <li className="flex justify-between">
					      <span className="font-medium">Durum:</span>
					      <span className={liveMode ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
					        {liveMode ? "Çevrim içi" : "Çevrim dışı"}
					      </span>
					    </li>
					    <li className="flex justify-between">
					      <span className="font-medium">Konum:</span>
					      <span className="text-gray-700">İstanbul, Türkiye</span>
					    </li>
					  </ul>
					</div>
	
				  {/* Genel Durum */}
				  <div className="lg:col-span-3 bg-white rounded-xl shadow p-4 h-full">
					  <h3 className="text-md font-bold text-gray-900 mb-4 text-center">Genel Durum</h3>
  					<ul className="space-y-4 text-base text-gray-900">
  					  <li className="flex justify-between">
  					    <span className="font-medium">Bugün Dolma Sayısı:</span>
  					    <span className="text-blue-600 font-semibold">3</span>
  					  </li>
  					  <li className="flex justify-between">
  					    <span className="font-medium">Uyarı Sayısı:</span>
  					    <span className="text-yellow-500 font-semibold">2</span>
  					  </li>
  					  <li className="flex justify-between">
  					    <span className="font-medium">Bağlantı Kesilme:</span>
  					    <span className="text-red-500 font-semibold">1</span>
  					  </li>
  					</ul>
				  </div>
				
				  {/* Takvim */}
				  <div className="lg:col-span-3 bg-white rounded-xl shadow p-6 h-full">
						<div className="mb-4 text-center">
							<h3 className="text-md font-bold text-gray-900">Tarih Seç</h3>
						</div>
						<div className="flex justify-center items-center">
				    	<div className="scale-[0.9] custom-calendar"> 
				    	  <DayPicker
				    	    mode="single"
				    	    selected={selectedDate}
				    	    onSelect={handleDateSelect}
				    	    locale={tr}
				    	  />
				    	</div>
						</div>
				  </div>
				</div>

		    {/* Middle Row: Capacity Arc + Sensors */}
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

