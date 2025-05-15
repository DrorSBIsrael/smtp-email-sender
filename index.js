app.post('/send-summary-email', async (req, res) => {
  const { clientName, phone, summary, type } = req.body;

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

  // Always send to Service
  const recipients = ['Service@sbcloud.co.il'];

  // If order or damage — also send to Office
  if (type === 'order' || type === 'damage') {
    recipients.push('Office@sbcloud.co.il');
  }

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
