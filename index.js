const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.012.net.il',
  port: 465,
  secure: SSL,
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

  const mailText = `
לקוח: ${clientName}
טלפון: ${phone || 'לא סופק'}

סיכום שיחה:
${summary}
  `;

  try {
    await transporter.sendMail({
      from: '"דו״ח שיחה" <Report@sbparking.co.il>',
      to: 'Service@sbcloud.co.il',
      subject: `סיכום שיחה עם ${clientName}`,
      text: mailText,
    });

    console.log('Email sent to Service@sbcloud.co.il');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('SMTP Email Sender is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});