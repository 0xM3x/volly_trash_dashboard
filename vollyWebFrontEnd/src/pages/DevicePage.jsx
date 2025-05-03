import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const deviceName = `Cihaz ${id}`;

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
		        <div className="bg-white rounded-xl shadow p-4 text-center">Gaz</div>
		        <div className="bg-white rounded-xl shadow p-4 text-center">Sıcaklık</div>
		        <div className="bg-white rounded-xl shadow p-4 text-center">Nem</div>
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

