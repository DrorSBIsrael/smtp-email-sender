const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// פונקציית קידוד כותרות UTF-8 ל-Base64
function encodeHeader(text) {
  const base64 = Buffer.from(text, 'utf-8').toString('base64');
  return `=?UTF-8?B?${base64}?=`;
}

// הגדרת SMTP דרך 012 עם SSL בפורט 465
const transporter = nodemailer.createTransport({
  host: 'smtp.012.net.il',
  port: 465,
  secure: true,
  auth: {
    user: 'Report@sbparking.co.il',
    pass: 'o51W38D5',
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.post('/send-summary-email', async (req, res) => {
  const { clientName, phone, summary } = req.body;

  if (!clientName || !summary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <strong>לקוח:</strong> ${clientName}<br/>
      <strong>טלפון:</strong> ${phone || 'לא סופק'}<br/><br/>
      <strong>סיכום שיחה:</strong><br/>
      <pre style="white-space: pre-wrap; font-family: inherit;">${summary}</pre>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `${encodeHeader('דו״ח שיחה')} <Report@sbparking.co.il>`,
      to: 'Service@sbcloud.co.il',
      subject: encodeHeader(`סיכום שיחה עם ${clientName}`),
      html: htmlContent,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Transfer-Encoding': 'quoted-printable'
      }
    });

    console.log('? Email sent to Service@sbcloud.co.il');
    res.status(200).json({ message: 'Email sent successfully with encoded headers' });
  } catch (error) {
    console.error('? Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('?? SMTP Email Sender is running (with encoded headers)');
});

app.listen(PORT, () => {
  console.log(`?? Server running on port ${PORT}`);
});
