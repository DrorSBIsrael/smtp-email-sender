const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.012.net.il',
  port: 25,
  secure: false,
  auth: {
    user: 'Report@sbparking.co.il',
    pass: 'o51W38D5',
  },
  tls: {
    rejectUnauthorized: false, // נדרש לפעמים בחיבורים לא מוצפנים
  }
});

app.post('/send-summary-email', async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  try {
    await transporter.sendMail({
      from: '"דו״ח סיכום שיחה" <Report@sbparking.co.il>',
      to,
      subject,
      text: body,
    });
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('SMTP Email Sender is up and running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
