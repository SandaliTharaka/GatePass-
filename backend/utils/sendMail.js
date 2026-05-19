// backend/utils/sendMail.js
const nodemailer = require("nodemailer");

// ─── SLT Intranet Mail Configuration ───
// Host: mail.slt.com.lk | Port: 25 | SSL: Enabled
// Account: gatepass@slt.com.lk
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.slt.com.lk",
  port: parseInt(process.env.EMAIL_PORT, 10) || 25,
  secure: process.env.EMAIL_SECURE === "true", // SSL enabled
  tls: {
    // Allow self-signed certificates common on intranet mail servers
    rejectUnauthorized: false,
  },
});

// Track SMTP availability and verify connection on startup (non-blocking)
let smtpAvailable = false;
let lastSmtpError = null;
transporter.verify((err) => {
  if (err) {
    smtpAvailable = false;
    lastSmtpError = err.message;
    console.error("[sendEmail] ⚠️  SMTP connection failed:", err.message);
    console.error("[sendEmail] Emails will NOT be sent until this is resolved.");
  } else {
    smtpAvailable = true;
    lastSmtpError = null;
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
  if (!process.env.EMAIL_USER && !process.env.EMAIL_FROM) {
    const msg = "Missing sender email in environment (EMAIL_USER or EMAIL_FROM)";
    console.error("[sendEmail]", msg);
    throw new Error(msg);
  }

  if (!smtpAvailable) {
    const msg = "SMTP server not available or connection failed";
    console.error("[sendEmail]", msg);
    throw new Error(msg);
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
    return info;
  } catch (err) {
    console.error("[sendEmail] Failed:", err.message);
    // Record last error for health checks
    lastSmtpError = err.message;
    // Re-throw so callers can detect failures and act (and surface to UI)
    throw err;
  }
}

function isSmtpAvailable() {
  return smtpAvailable;
}

function getLastSmtpError() {
  return lastSmtpError;
}

module.exports = { sendEmail, isSmtpAvailable, getLastSmtpError };
