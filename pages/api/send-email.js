// api/send-email.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, message, userEmail, userName, userId } = req.body;

  // Validate input
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    // Get Resend API key from environment variable
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Resona Support <onboarding@resend.dev>',
        to: ['assistance.resona@outlook.com'],
        reply_to: userEmail,
        subject: `[Support] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8A2BE2;">New Support Message from Resona App</h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>From:</strong> ${userName || 'User'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId || 'N/A'}</p>
            </div>
            
            <hr style="border: 1px solid #ddd; margin: 20px 0;" />
            
            <h3 style="color: #333;">Subject: ${subject}</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #8A2BE2; margin: 20px 0;">
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <hr style="border: 1px solid #ddd; margin: 20px 0;" />
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Sent from Resona App Support Form
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      id: data.id 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to send email' 
    });
  }
}