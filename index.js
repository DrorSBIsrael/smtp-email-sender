const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// הגדרת SMTP
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

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// נקודת קבלת בקשה מה-GPT או מכל מקור אחר
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

  // רשימת כתובות קבועה
  const recipients = ['Service@sbcloud.co.il', 'Office@sbcloud.co.il'];

  try {
    await transporter.sendMail({
      from: '"דו״ח שיחה" <Report@sbparking.co.il>',
      to: recipients,
      subject: `סיכום שיחה עם ${clientName}`,
      html: htmlContent,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    });

    console.log('? Email sent to:', recipients.join(', '));
    res.status(200).json({ message: `Email sent to: ${recipients.join(', ')}` });
  } catch (error) {
    console.error('? Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// בדיקה מהירה ששרת זמין
app.get('/', (req, res) => {
  res.send('?? SMTP Email Sender is running');
});

app.listen(PORT, () => {
  console.log(`?? Server running on port ${PORT}`);
});

const fs = require('fs');
const path = require('path');

const CLIENTS_PATH = path.join(__dirname, 'clients.json');

// זיהוי לקוח לפי שם / חניון / טלפון
app.post('/identify-client', (req, res) => {
  const { clientName, parkingName, phone } = req.body;

  try {
    const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf-8'));

    const match = clients.find(c =>
      (clientName && c["שם הלקוח"] && c["שם הלקוח"].includes(clientName)) ||
      (parkingName && c["שם החניון"] && c["שם החניון"].includes(parkingName)) ||
      (phone && c["טלפון"] && c["טלפון"] === phone)
    );

    if (match) {
      return res.status(200).json({ match });
    } else {
      return res.status(404).json({ message: 'לקוח לא נמצא' });
    }
  } catch (err) {
    console.error('שגיאה בזיהוי לקוח:', err);
    res.status(500).json({ error: 'שגיאה בקריאת קובץ לקוחות' });
  }
});



// הוספת לקוח חדש לקובץ
app.post('/add-client', (req, res) => {
  const newClient = req.body;

  if (!newClient.clientName || !newClient.parkingName || !newClient.email) {
    return res.status(400).json({ error: 'שדות חובה חסרים' });
  }

  try {
    const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf-8'));
    newClient.id = Date.now(); // מזהה ייחודי
    clients.push(newClient);
    fs.writeFileSync(CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf-8');

    res.status(201).json({ message: 'לקוח נוסף', client: newClient });
  } catch (err) {
    console.error('שגיאה בהוספת לקוח:', err);
    res.status(500).json({ error: 'בעיה בכתיבה לקובץ לקוחות' });
  }
});

