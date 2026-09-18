// ─────────────────────────────────────────────────────────────
// email.ts — transactional email for bookings, sent over SMTP via
// nodemailer. Works out of the box with a Gmail App Password
// (SMTP_HOST=smtp.gmail.com, port 465). When SMTP_* env vars are not
// set the helpers return 'skipped' so the site behaves exactly as
// before — email is opt-in configuration.
//
// Env: SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASS,
//      MAIL_FROM (default: `Paul Hair Studio <SMTP_USER>`).
// ─────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import { formatTime12h } from './bookingTime';

export type EmailResult = 'sent' | 'skipped' | 'error';

export interface BookingEmailDetails {
  clientEmail?: string;
  clientName?: string;
  serviceName?: string;
  stylistName?: string;
  date?: string;
  time?: string;
}

/** Real send path — returns 'skipped' when SMTP is not configured. */
export async function sendBookingConfirmationEmail(
  booking: BookingEmailDetails
): Promise<EmailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const to = booking.clientEmail?.trim();

  if (!host || !user || !pass || !to) return 'skipped';

  const port = Number(process.env.SMTP_PORT?.trim() || '465');
  const from =
    process.env.MAIL_FROM?.trim() || `Paul Hair Studio <${user}>`;
  const salutation = booking.clientName?.trim() || 'there';
  const time12 = formatTime12h(booking.time || '');

  const text = [
    `Hi ${salutation},`,
    '',
    `Good news — your appointment at Paul Hair Studio is confirmed!`,
    '',
    `  Service:    ${booking.serviceName || '-'}`,
    `  Stylist:    ${booking.stylistName || 'Any available artisan'}`,
    `  Date:       ${booking.date || '-'}`,
    `  Time:       ${time12 || '-'}`,
    '',
    'We look forward to welcoming you to the studio.',
    '',
    'Paul Hair Studio',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="border-top:4px solid #f3cbd7"></div>
      <h2 style="text-transform:uppercase;letter-spacing:-0.02em;margin:24px 0 6px">Your booking is confirmed</h2>
      <p style="margin:0 0 20px;color:#555">Hi ${salutation}, good news — your appointment with Paul Hair Studio is locked in:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr><td style="padding:8px 0;color:#888;width:110px">Service</td><td style="padding:8px 0;font-weight:bold">${booking.serviceName || '-'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;width:110px">Stylist</td><td style="padding:8px 0;font-weight:bold">${booking.stylistName || 'Any available artisan'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;width:110px">Date</td><td style="padding:8px 0;font-weight:bold">${booking.date || '-'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;width:110px">Time</td><td style="padding:8px 0;font-weight:bold">${time12 || '-'}</td></tr>
      </table>
      <p style="color:#555;margin:0 0 4px">We look forward to welcoming you to the studio.</p>
      <p style="margin:0 0 24px;color:#555">— Paul Hair Studio</p>
      <div style="border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#999">
        Zurich · Paris — The house of hair education.
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from, to, subject: 'Your booking at Paul Hair Studio is confirmed', text, html });
    return 'sent';
  } catch (err) {
    console.error('[email] confirmation email failed to send', err);
    return 'error';
  }
}