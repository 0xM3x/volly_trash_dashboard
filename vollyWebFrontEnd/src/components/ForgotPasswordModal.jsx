import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from '../utils/axiosInstance';

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [timer, setTimer] = useState(180);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendCode = async () => {
    if (!recaptchaToken) {
      toast.error('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
      return;
    }

    try {
      await axios.post('/auth/forgot-password', { email });
      toast.success('Doğrulama kodu e-posta adresinize gönderildi.');
      setStep(2);
      setTimer(180);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Kod gönderilirken bir hata oluştu.'
      );
    }
  };

  const handleVerifyCode = async () => {
    try {
      await axios.post('/auth/verify-code', { email, code });
      toast.success('Kod doğrulandı. Yeni şifrenizi belirleyin.');
      setStep(3);
    } catch (err) {
      toast.error('Kod geçersiz veya süresi dolmuş.');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor.');
      return;
    }

    try {
      await axios.post('/auth/reset-password', { email, code, newPassword });
      toast.success('Şifreniz başarıyla güncellendi.');
      onClose();
    } catch (err) {
      toast.error('Şifre güncellenemedi. Kod geçersiz olabilir.');
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <p className="text-sm mb-2 text-gray-600">
            Lütfen kayıtlı e-posta adresinizi girin ve reCAPTCHA doğrulamasını tamamlayın. Size bir doğrulama kodu göndereceğiz.
          </p>
          <input
            type="email"
            placeholder="E-posta adresiniz"
            className="w-full px-4 py-2 border rounded-lg mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
          />
          <button onClick={handleSendCode} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Kodu Gönder
          </button>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <p className="text-sm mb-2 text-gray-600">
            E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
          </p>
          <input
            type="text"
            placeholder="Doğrulama kodu"
            className="w-full px-4 py-2 border rounded-lg mb-3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${((180 - timer) / 180) * 100}%` }}
            ></div>
          </div>
          {timer > 0 ? (
            <button
              onClick={handleVerifyCode}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Kodu Doğrula
            </button>
          ) : (
            <p className="text-sm text-red-500 text-center">
              Kodun süresi doldu. Lütfen tekrar deneyin.
            </p>
          )}
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <p className="text-sm mb-2 text-gray-600">
            Yeni şifrenizi girin ve onaylayın.
          </p>
          <input
            type="password"
            placeholder="Yeni şifre"
            className="w-full px-4 py-2 border rounded-lg mb-3"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Yeni şifre (tekrar)"
            className="w-full px-4 py-2 border rounded-lg mb-3"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            onClick={handleResetPassword}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Şifreyi Güncelle
          </button>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">Şifremi Unuttum</h2>
        {renderStepContent()}
      </div>
    </div>
  );
}
