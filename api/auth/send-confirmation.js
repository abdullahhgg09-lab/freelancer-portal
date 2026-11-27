import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

function escapeHtml(raw) {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : 'Portal User';
  const role = body.role === 'client' ? 'Client Portal' : 'Freelancer Workspace';
  const rawPortalUrl = typeof body.portalUrl === 'string' ? body.portalUrl.trim() : '';
  const safePortalUrl = /^https?:\/\//i.test(rawPortalUrl) ? rawPortalUrl : 'https://freelanceport.pk';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, message: 'Valid email address is required.' });
    return;
  }

  const referenceId = `CONF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  if (smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: (process.env.SMTP_FROM || `"FreelancePort.pk" <${smtpUser}>`).trim(),
        to: email,
        subject: `Sign-In Confirmed — FreelancePort.pk (${role})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
            <div style="background: #0f172a; color: #ffffff; padding: 20px 24px;">
              <div style="font-size: 11px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">FreelancePort.pk</div>
              <h2 style="margin: 6px 0 0; font-size: 18px;">Login Confirmation</h2>
            </div>
            <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
              <p>Assalam-o-Alaikum <strong>${escapeHtml(name)}</strong>,</p>
              <p>Your account (<strong>${escapeHtml(email)}</strong>) signed in to <strong>${role}</strong> on FreelancePort.pk.</p>
              <p>Confirmation Reference: <strong>${referenceId}</strong></p>
              <p style="margin-top: 18px;">
                <a href="${escapeHtml(safePortalUrl)}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold;">Open Workspace</a>
              </p>
            </div>
          </div>
        `,
      });

      res.status(200).json({ ok: true, deliveredVia: 'smtp', referenceId });
      return;
    } catch (err) {
      console.error('Vercel SMTP delivery error:', err);
    }
  }

  res.status(200).json({
    ok: true,
    deliveredVia: 'in_app',
    referenceId,
    message: 'Signed in and confirmed in workspace.',
  });
}
