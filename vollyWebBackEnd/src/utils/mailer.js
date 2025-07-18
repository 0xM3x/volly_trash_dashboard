const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetCode(email, code) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Şifre Sıfırlama Kodunuz',
    html: `
      <h2>Şifre Sıfırlama</h2>
      <p>Merhaba,</p>
      <p>Şifrenizi sıfırlamak için doğrulama kodunuz:</p>
      <h3>${code}</h3>
      <p>Bu kod 3 dakika içinde geçerlidir.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendResetCode };
