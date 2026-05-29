import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token, action, points } = req.query;

  if (!token || !action) {
    return res.status(400).send(renderPage('Eroare', 'Parametri lipsa din URL.', 'error'));
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).send(renderPage('Eroare', 'Actiune invalida.', 'error'));
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('analyses')
    .select('id, title, status')
    .eq('approval_token', token)
    .single();

  if (fetchError || !existing) {
    return res.status(404).send(renderPage(
      'Submisie inexistenta',
      'Tokenul nu corespunde niciunei submisii. Poate a fost deja procesata sau linkul a expirat.',
      'error'
    ));
  }

  if (existing.status !== 'pending') {
    return res.status(200).send(renderPage(
      'Submisie deja procesata',
      `Submisia "${escapeHtml(existing.title)}" are deja status: ${existing.status}. Nicio modificare aplicata.`,
      'warning'
    ));
  }

  const parsedPoints = parseInt(points);
  const validPoints = isNaN(parsedPoints) ? 30 : Math.max(0, Math.min(100, parsedPoints));

  const updates = action === 'approve'
    ? { status: 'approved', points: validPoints }
    : { status: 'rejected', points: 0 };

  const { error: updateError } = await supabaseAdmin
    .from('analyses')
    .update(updates)
    .eq('approval_token', token);

  if (updateError) {
    return res.status(500).send(renderPage(
      'Eroare',
      `Nu s-a putut actualiza inregistrarea: ${escapeHtml(updateError.message)}`,
      'error'
    ));
  }

  const message = action === 'approve'
    ? `Submisia "${escapeHtml(existing.title)}" a fost aprobata cu ${validPoints} puncte si este acum vizibila public pe platforma.`
    : `Submisia "${escapeHtml(existing.title)}" a fost respinsa.`;

  const variant = action === 'approve' ? 'success' : 'rejected';
  const title = action === 'approve' ? 'Aprobat cu succes' : 'Respins cu succes';

  return res.status(200).send(renderPage(title, message, variant));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPage(title, message, variant) {
  const colors = {
    success: { primary: '#10b981', icon: '&#10004;' },
    rejected: { primary: '#dc2626', icon: '&#10006;' },
    error: { primary: '#dc2626', icon: '&#9888;' },
    warning: { primary: '#f59e0b', icon: '&#9888;' }
  };
  const c = colors[variant] || colors.error;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Populist Discourse Observatory</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, serif; background: #f3f4f6; margin: 0; padding: 40px 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 500px; width: 100%; text-align: center; }
    .icon { font-size: 56px; margin-bottom: 20px; color: ${c.primary}; line-height: 1; }
    h1 { color: ${c.primary}; margin: 0 0 15px; font-size: 24px; }
    p { color: #4b5563; line-height: 1.6; margin: 0 0 25px; }
    a.btn { display: inline-block; padding: 12px 28px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    a.btn:hover { background: #1e40af; }
    .footer { margin-top: 25px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${c.icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://observatory.populistgamemode.com" class="btn">Inapoi la platforma</a>
    <div class="footer">Jean Monnet Module POPULIST-GAMEMODE | Grant 101238497</div>
  </div>
</body>
</html>`;
}
