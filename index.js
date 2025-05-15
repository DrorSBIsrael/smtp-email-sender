const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// ����� SMTP
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

// ����� ���� ���� ��-GPT �� ��� ���� ���
app.post('/send-summary-email', async (req, res) => {
  const { clientName, phone, summary } = req.body;

  if (!clientName || !summary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <strong>����:</strong> ${clientName}<br/>
      <strong>�����:</strong> ${phone || '�� ����'}<br/><br/>
      <strong>����� ����:</strong><br/>
      <pre style="white-space: pre-wrap; font-family: inherit;">${summary}</pre>
    </div>
  `;

  // ����� ������ �����
  const recipients = ['Service@sbcloud.co.il', 'Office@sbcloud.co.il'];

  try {
    await transporter.sendMail({
      from: '"���� ����" <Report@sbparking.co.il>',
      to: recipients,
      subject: `����� ���� �� ${clientName}`,
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

// ����� ����� ���� ����
app.get('/', (req, res) => {
  res.send('?? SMTP Email Sender is running');
});

app.listen(PORT, () => {
  console.log(`?? Server running on port ${PORT}`);
});

const fs = require('fs');
const path = require('path');

const CLIENTS_PATH = path.join(__dirname, 'clients.json');

// ����� ���� ��� �� / ����� / IP
app.post('/identify-client', (req, res) => {
  const { clientName, parkingName, ip } = req.body;

  try {
    const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf-8'));
    const match = clients.find(c =>
      (clientName && c.clientName.includes(clientName)) ||
      (parkingName && c.parkingName.includes(parkingName)) ||
      (ip && c.ip === ip)
    );

    if (match) {
      return res.status(200).json({ match });
    } else {
      return res.status(404).json({ message: '���� �� ����' });
    }
  } catch (err) {
    console.error('����� ������ ����:', err);
    res.status(500).json({ error: '����� ������ ���� ������' });
  }
});

// ����� ���� ��� �����
app.post('/add-client', (req, res) => {
  const newClient = req.body;

  if (!newClient.clientName || !newClient.parkingName || !newClient.email) {
    return res.status(400).json({ error: '���� ���� �����' });
  }

  try {
    const clients = JSON.parse(fs.readFileSync(CLIENTS_PATH, 'utf-8'));
    newClient.id = Date.now(); // ���� ������
    clients.push(newClient);
    fs.writeFileSync(CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf-8');

    res.status(201).json({ message: '���� ����', client: newClient });
  } catch (err) {
    console.error('����� ������ ����:', err);
    res.status(500).json({ error: '���� ������ ����� ������' });
  }
});

