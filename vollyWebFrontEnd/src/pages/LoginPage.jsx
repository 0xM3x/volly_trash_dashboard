import { useState } from 'react';
import logo from '../assets/vollylogo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === 'admin@admin.com' && password === 'admin') {
      localStorage.setItem('user', JSON.stringify({ email }));
      window.location.href = '/';
    } else {
      setError('E-posta veya şifre hatalı.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo" className="w-28 mx-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-Posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg"
              placeholder="example@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 font-medium">{error}</div>
          )}

          <div className="text-right text-sm">
            <a href="#" className="text-blue-500 hover:underline">Şifremi Unuttum?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}

