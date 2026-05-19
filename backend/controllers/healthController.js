const { isSmtpAvailable, getLastSmtpError } = require('../utils/sendMail');

exports.smtpHealth = (req, res) => {
  try {
    const available = Boolean(isSmtpAvailable());
    const lastError = getLastSmtpError();
    return res.json({ ok: true, smtpAvailable: available, lastError });
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(500).json({ ok: false, message: 'Health check failed' });
  }
};
