// backend/utils/sendMail.js
const nodemailer = require("nodemailer");

// ─── SLT Intranet Mail Configuration ───
// Host: mail.slt.com.lk | Port: 25 | SSL: Enabled
// Account: gatepass@slt.com.lk
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.slt.com.lk",
  port: parseInt(process.env.EMAIL_PORT, 10) || 25,
  secure: process.env.EMAIL_SECURE === "true", // SSL enabled
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Allow self-signed certificates common on intranet mail servers
    rejectUnauthorized: false,
  },
});

// Verify SMTP connection on startup (non-blocking)
transporter.verify((err) => {
  if (err) {
    console.error("[sendEmail] ⚠️  SMTP connection failed:", err.message);
    console.error("[sendEmail] Emails will NOT be sent until this is resolved.");
  } else {
    console.log("[sendEmail] ✅ SMTP connection verified — ready to send mail");
  }
});

/**
 * Send email internally (used by controllers)
 * @param {string|string[]} to
 * @param {string} subject
 * @param {string} html
 * @param {string} [text]
 */
async function sendEmail(to, subject, html, text = "") {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[sendEmail] Missing email credentials in .env (EMAIL_USER / EMAIL_PASS)");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log("[sendEmail] Sent:", info.messageId, "→", to);
  } catch (err) {
    console.error("[sendEmail] Failed:", err.message);
  }
}

module.exports = { sendEmail };
