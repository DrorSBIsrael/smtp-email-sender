const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// SMTP הגדרת
const transporter = nodemailer.createTransport({
  host: 'smtp.012.net.il',
  port: 465,
  secure: true,
  auth: {
    user: 'Report@sbparking.co.il',
    pass: 'o51W38D5',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

app.post('/send-summary-email', async (req, res) => {
  console.log('?? Got request from GPT:', req.body);

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

  const recipients = ['Service@sbcloud.co.il', 'Office@sbcloud.co.il'];

  try {
    await transporter.sendMail({
      from: '"דו״ח שיחה" <Report@sbparking.co.il>',
      to: recipients,
      subject: `סיכום שיחה עם ${clientName}`,
      html: htmlContent,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    });

    console.log('? Email sent to:', recipients.join(', '));
    res.status(200).json({ message: `Email sent to: ${recipients.join(', ')}` });
  } catch (error) {
    console.error('? Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('?? SMTP Email Sender is running');
});

app.listen(PORT, () => {
  console.log(`?? Server running on port ${PORT}`);
});
