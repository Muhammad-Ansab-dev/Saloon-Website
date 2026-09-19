// ─────────────────────────────────────────────────────────────
// email.ts — transactional email for bookings, sent over SMTP via
// nodemailer. Works out of the box with a Gmail App Password
// (SMTP_HOST=smtp.gmail.com, port 465). When SMTP_* env vars are not
// set the helpers return 'skipped' so the site behaves exactly as
// before — email is opt-in configuration.
//
// Env: SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASS,
//      MAIL_FROM (default: `Paul Hair Studio <SMTP_USER>`).
// In plain words: when someone books an appointment, this file can email the
// client a little confirmation. Email is optional — unless SMTP is set up,
// nothing is sent and nothing on the site breaks.
// ─────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import { formatTime12h } from './bookingTime';

// Outcome of a send attempt: 'sent' (delivered), 'skipped' (SMTP not set up /
// no recipient), or 'error' (the SMTP server rejected the send).
export type EmailResult = 'sent' | 'skipped' | 'error';

// The booking details that appear in the confirmation email. Every field is
// optional because a booking might be missing bits of information.
export interface BookingEmailDetails {
  clientEmail?: string;
  clientName?: string;
  serviceName?: string;
  stylistName?: string;
  date?: string;
  time?: string;
}

// Compose and send the booking-confirmation email via SMTP. Params: booking —
// the client/service/date/time details to mention. Returns 'sent' on success,
// 'skipped' when SMTP isn't configured or there is no recipient address, and
// 'error' if nodemailer throws. Site behaviour is unchanged when email isn't set up.
export async function sendBookingConfirmationEmail(
  booking: BookingEmailDetails
): Promise<EmailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const to = booking.clientEmail?.trim();

  // Email is opt-in: with SMTP missing or no recipient we quietly skip rather
  // than fail the booking flow.
  if (!host || !user || !pass || !to) return 'skipped';

  const port = Number(process.env.SMTP_PORT?.trim() || '465');
  const from =
    process.env.MAIL_FROM?.trim() || `Paul Hair Studio <${user}>`;
  const salutation = booking.clientName?.trim() || 'there';
  const time12 = formatTime12h(booking.time || '');

  // Plain-text body — the same details as the HTML version below, so the email
  // reads fine in any client (no HTML needed).
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
    // Log and report 'error' so the caller can decide whether to surface it;
    // the actual booking is still saved regardless of the email outcome.
    console.error('[email] confirmation email failed to send', err);
    return 'error';
  }
}