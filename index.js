const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
    rejectUnauthorized: false, // 1
  }
});

app.post('/send-summary-email', async (req, res) => {
  const { clientName, phone, summary } = req.body;

  if (!clientName || !summary) {
    return res.status(400).json({ error: 'Missing required fields: clientName, summary' });
  }

  const bodyText = `
����: ${clientName}
�����: ${phone || '�� ����'}

����� ����:
${summary}
  `;

  try {
    await transporter.sendMail({
      from: '���� ��� <Report@sbparking.co.il>',
      to: 'Dror@sbparking.co.il', // Test
      subject: `����� ���� �� ${clientName}`,
      text: bodyText,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
