import Layout from '../components/Layout';
import Chart from 'react-apexcharts';

import { FiCpu, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

export default function DashboardPage() {
  // Sample device counts
  const stats = {
    total: 12,
    online: 7,
    offline: 3,
    outOfService: 2,
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${card.color}`}
          >
            <div>
              <div className="text-sm font-medium">{card.label}</div>
              <div className="text-2xl font-bold">{card.value}</div>
            </div>
            <div>{card.icon}</div>
          </div>
        ))}
      </div>
  	{/* Graph + Most/Least Cards */}
  	  <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
  	    {/* Chart */}
  	    <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
  	      <h2 className="text-lg font-semibold mb-2">Haftalık Dolu Cihaz Sayısı</h2>
  	      <Chart
  	        options={{
  	          chart: { id: 'full-devices' },
  	          xaxis: { categories: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] },
  	          colors: ['#3b82f6'],
  	        }}
  	        series={[{ name: 'Dolu Cihazlar', data: [3, 5, 2, 6, 4, 1, 3] }]}
  	        type="bar"
  	        height={300}
  	      />
  	    </div>

  	    {/* Right-side cards */}
  	    <div className="flex flex-col gap-4">
  	      <div className="flex-1 bg-sky-100 text-sky-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
  	        <div className="text-sm font-medium">Bu Hafta En Çok Dolu Olan Cihaz</div>
  	        <div className="text-xl font-bold mt-2">Cihaz 2</div>
  	        <div className="text-xs mt-1">Toplam 12 kez doldu</div>
  	      </div>
  	      <div className="flex-1 bg-rose-100 text-rose-800 rounded-lg shadow p-6 flex flex-col items-center justify-center text-center">
  	        <div className="text-sm font-medium">Bu Hafta En Az Dolu Olan Cihaz</div>
  	        <div className="text-xl font-bold mt-2">Cihaz 5</div>
  	        <div className="text-xs mt-1">Toplam 2 kez doldu</div>
  	      </div>
  	    </div>
  	  </div>
    </Layout>
  );
}

