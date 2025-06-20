import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // ← important
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired or invalid tokens globally
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Optional: show toast message
      // toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');

      // Clear stored credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

export default axiosInstance;


