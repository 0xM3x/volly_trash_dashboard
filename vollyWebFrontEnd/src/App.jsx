import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DevicePage from './pages/DevicePage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ClientPage from './pages/ClientPage';

import ProtectedRoute from './routes/ProtectedRoute';


import './index.css'

function App() {
  return (
		<BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/device/:id" element={<ProtectedRoute><DevicePage /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
