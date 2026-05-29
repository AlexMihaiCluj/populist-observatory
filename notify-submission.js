import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { record } = req.body;

  if (!record || record.status !== 'pending') {
    return res.status(200).json({ message: 'Skipped (not pending)' });
  }

  const baseUrl = 'https://observatory.populistgamemode.com';
  const token = record.approval_token;

  const approve20 = `${baseUrl}/api/moderate?token=${token}&action=approve&points=20`;
  const approve40 = `${baseUrl}/api/moderate?token=${token}&action=approve&points=40`;
  const approve60 = `${baseUrl}/api/moderate?token=${token}&action=approve&points=60`;
  const reject = `${baseUrl}/api/moderate?token=${token}&action=reject`;

  const contentPreview = (record.content || record.description || record.analysis || 'N/A');
  const truncated = contentPreview.length > 500
    ? contentPreview.substring(0, 500) + '...'
    : contentPreview;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
      <div style="background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Submisie nouă pe Populist Discourse Observatory</h2>
      </div>
      <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; width: 140px; color: #374151;">Titlu:</td><td style="color: #111827;">${record.title || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Tara:</td><td style="color: #111827;">${record.country || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Autor:</td><td style="color: #111827;">${record.author_name || record.author || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td><td style="color: #111827;">${record.author_email || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Sursa:</td><td style="color: #111827; word-break: break-all;">${record.source_url || record.url || 'N/A'}</td></tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-left: 4px solid #1e3a8a; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #4b5563; line-height: 1.5;">${truncated}</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #374151;">Decide actiunea:</p>

          <a href="${approve20}" style="display: inline-block; padding: 12px 18px; margin: 5px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Aproba (20 pct)</a>
          <a href="${approve40}" style="display: inline-block; padding: 12px 18px; margin: 5px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Aproba (40 pct)</a>
          <a href="${approve60}" style="display: inline-block; padding: 12px 18px; margin: 5px; background: #047857; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Aproba (60 pct)</a>
          <br>
          <a href="${reject}" style="display: inline-block; padding: 12px 22px; margin: 15px 5px 5px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Respinge</a>
        </div>

        <p style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
          Click pe oricare buton aplica decizia direct in baza de date.<br>
          Pentru gestionare avansata, foloseste panoul admin de pe site.
        </p>
      </div>

      <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
        Jean Monnet Module POPULIST-GAMEMODE | Grant 101238497
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Populist Observatory <onboarding@resend.dev>',
      to: 'contact@populistgamemode.com',
      replyTo: record.author_email || 'contact@populistgamemode.com',
      subject: `[Observatory] Submisie noua: ${record.title || 'Untitled'} (${record.country || 'N/A'})`,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Notification sent', id: data?.id });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
