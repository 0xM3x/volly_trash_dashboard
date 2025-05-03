import Layout from '../components/Layout';

export default function DashboardPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold">Dashboard Sayfası</h1>
		  console.log('LocalStorage:', localStorage.getItem('user'));
    </Layout>

  );
}

