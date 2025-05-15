const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// פונקציית קידוד UTF-8 עם Base64 לכותרות
function encodeHeader(text) {
  const base64 = Buffer.from(text, 'utf-8').toString('base64');
  return `=?UTF-8?B?${base64}?=`;
}

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
      <strong>Client:</strong> ${clientName}<br/>
      <strong>Phone:</strong> ${phone || 'Not provided'}<br/><br/>
      <strong>Conversation Summary:</strong><br/>
      <pre style="white-space: pre-wrap; font-family: inherit;">${summary}</pre>
    </div>
  `;

  // Always send to both
  const recipients = ['Service@sbcloud.co.il', 'Office@sbcloud.co.il'];

  try {
    await transporter.sendMail({
      from: '"Chat Summary" <Report@sbparking.co.il>',
      to: recipients,
      subject: `Chat Summary for ${clientName}`,
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
