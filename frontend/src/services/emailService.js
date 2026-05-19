import axios from './axiosConfig';

// DEPRECATED service: Manual client-side email sending is deprecated.
// Keep this shim for backward compatibility; prefer server-side flows.
let _warned = false;
function warnOnce() {
  if (_warned) return;
  console.warn(
    '[emailService] DEPRECATED: Manual client-side email sending is deprecated.\n' +
      'Please use server-driven notification flows (controllers trigger emails).\n' +
      'This helper will be removed in a future release.'
  );
  _warned = true;
}

/**
 * Send an email via legacy endpoint.
 * This function will log a deprecation warning on first use.
 * It still attempts to call POST /email/send-email so existing pages don't break.
 * If the request fails (endpoint removed), the error is re-thrown so callers can handle it.
 */
export async function emailSent(payload) {
  warnOnce();
  try {
    const resp = await axios.post('/email/send-email', payload);
    return resp;
  } catch (err) {
    console.warn('[emailService] send failed:', err?.response?.data || err.message || err);
    throw err;
  }
}

export default { emailSent };
