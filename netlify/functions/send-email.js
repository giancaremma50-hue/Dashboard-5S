exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { to, subject, html } = JSON.parse(event.body);
    if (!to || !subject || !html) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FERCO Auditorías 5S <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    });
    const data = await res.json();
    return { statusCode: res.ok ? 200 : res.status, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
