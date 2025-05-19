
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

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

app.post('/send-summary-email', upload.single('attachment'), async (req, res) => {
  let clientName, phone, summary, file, attachmentUrl;

  if (req.is('multipart/form-data')) {
    clientName = req.body.clientName;
    phone = req.body.phone;
    summary = req.body.summary;
    attachmentUrl = req.body.attachmentUrl;
    file = req.file;
    if (file) console.log('📎 קובץ התקבל (upload):', file.originalname);
    else console.warn('⚠️ קובץ לא התקבל דרך upload');
  } else {
    ({ clientName, phone, summary, attachmentUrl } = req.body);
    file = null;
    console.log('📨 JSON רגיל התקבל (ללא קובץ ישיר)');
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

  let tempDownloadPath = null;
  if (file) {
    mailOptions.attachments = [{ filename: file.originalname, path: file.path }];
  } else if (attachmentUrl) {
    try {
      const fileName = `downloaded-${Date.now()}.jpg`;
      tempDownloadPath = path.join(__dirname, 'uploads', fileName);
      const response = await axios({ method: 'get', url: attachmentUrl, responseType: 'stream' });
      const writer = fs.createWriteStream(tempDownloadPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log('⬇️ קובץ ירד מ־URL:', attachmentUrl);
      mailOptions.attachments = [{ filename: fileName, path: tempDownloadPath }];
    } catch (err) {
      console.warn('⚠️ שגיאה בהורדת קובץ מה־attachmentUrl:', err.message);
    }
  } else {
    console.log('ℹ️ לא התקבל קובץ כלל (לא דרך upload ולא דרך URL)');
  }

  try {
    await transporter.sendMail(mailOptions);
    if (file) fs.unlinkSync(file.path);
    if (tempDownloadPath && fs.existsSync(tempDownloadPath)) fs.unlinkSync(tempDownloadPath);
    console.log(`✅ מייל נשלח אל: ${recipients.join(', ')}`);
    res.status(200).json({ message: `Email sent to: ${recipients.join(', ')}` });
  } catch (error) {
    console.error('❌ שגיאה בשליחת המייל:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('📡 SMTP Email Sender is running');
});

app.listen(PORT, () => {
  console.log(`📡 Server running on port ${PORT}`);
});
