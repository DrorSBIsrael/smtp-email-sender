// index.js (גרסה מלאה כולל תמיכה בקובץ ולוגים)
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// 📁 יצירת תיקיית uploads אם לא קיימת
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use((req, res, next) => {
  console.log(`📥 בקשה נכנסת: ${req.method} ${req.url}`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 📤 הגדרת SMTP
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

// 📤 שליחת מייל עם או בלי קובץ מצורף
app.post('/send-summary-email', upload.single('attachment'), async (req, res) => {
  let clientName, phone, summary, file;

  if (req.is('multipart/form-data')) {
    clientName = req.body.clientName;
    phone = req.body.phone;
    summary = req.body.summary;
    file = req.file;
    if (!file) console.warn('⚠️ קובץ לא התקבל בשרת (req.file ריק)');
    else console.log('📎 קובץ מצורף:', file.originalname);
  } else {
    ({ clientName, phone, summary } = req.body);
    file = null;
  }

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

  const mailOptions = {
    from: 'Report@sbparking.co.il',
    to: recipients,
    subject: `סיכום שיחה עם ${clientName}`,
    html: htmlContent,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  };

  if (file) {
    mailOptions.attachments = [{
      filename: file.originalname,
      path: file.path
    }];
  }

  try {
    await transporter.sendMail(mailOptions);
    if (file) fs.unlinkSync(file.path); // 🧹 ניקוי קובץ זמני
    console.log(`✅ מייל נשלח ל־${recipients.join(', ')}`);
    res.status(200).json({ message: `Email sent to: ${recipients.join(', ')}` });
  } catch (error) {
    console.error('❌ שגיאה בשליחת המייל:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 🔍 בדיקת חיים
app.get('/', (req, res) => {
  res.send('📡 SMTP Email Sender is running');
});

// 🚀 הפעלת השרת
app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});
