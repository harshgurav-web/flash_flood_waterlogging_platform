/**
 * Traccar Android SMS Gateway Service
 * Delivers SMS messages via local Android HTTP gateway without exposing auth token.
 */

// Normalizes phone number to E.164 format (e.g. +91XXXXXXXXXX)
function normalizePhoneNumber(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[\s\-\(\)]/g, '');
  if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
    return cleaned;
  }
  // Standard 10-digit Indian mobile number
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  // 12-digit number starting with 91
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return null;
}

// Safely masks phone number for logs and API responses (e.g. +91******4321)
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '***';
  if (phone.length <= 5) return '***';
  const start = phone.slice(0, 3);
  const end = phone.slice(-4);
  return `${start}******${end}`;
}

/**
 * Sends an SMS through the Traccar Android Gateway.
 * @param {string} phone - Target phone number
 * @param {string} message - Text message content
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
async function sendSms(phone, message) {
  // 1. Validate phone and message
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return {
      success: false,
      error: 'Invalid recipient phone number. Please provide a valid 10-digit or international format number (e.g., +91XXXXXXXXXX).'
    };
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      success: false,
      error: 'SMS message body cannot be empty.'
    };
  }

  // 2. Read gateway configuration from environment
  const gatewayUrl = (process.env.SMS_GATEWAY_URL || '').trim();
  const gatewayToken = (process.env.SMS_GATEWAY_TOKEN || '').trim();

  if (!gatewayUrl) {
    return {
      success: false,
      error: 'SMS gateway URL is not configured (SMS_GATEWAY_URL missing).'
    };
  }

  if (!gatewayToken) {
    return {
      success: false,
      error: 'SMS gateway service token is not configured (SMS_GATEWAY_TOKEN missing).'
    };
  }

  // Ensure trailing slash on target endpoint: ${SMS_GATEWAY_URL}/
  const targetUrl = gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    console.log(`[SMS Service] Sending SMS to ${maskPhoneNumber(normalizedPhone)} via Traccar Gateway...`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': gatewayToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: normalizedPhone,
        message: message.trim()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`[SMS Service] Successfully dispatched SMS to ${maskPhoneNumber(normalizedPhone)}`);
      return {
        success: true,
        message: 'SMS dispatched successfully via Traccar Android Gateway.'
      };
    }

    if (response.status === 401 || response.status === 403) {
      console.warn(`[SMS Service] Gateway authorization rejected (HTTP ${response.status})`);
      return {
        success: false,
        error: 'SMS gateway authorization rejected. Please verify the gateway service token.'
      };
    }

    console.warn(`[SMS Service] Gateway returned status ${response.status}`);
    return {
      success: false,
      error: `SMS gateway returned an error (HTTP ${response.status}).`
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[SMS Service] Gateway request timed out after 10s');
      return {
        success: false,
        error: 'SMS gateway timed out. Ensure the Android device is running Traccar Gateway and connected to the local network.'
      };
    }

    // Network / offline error handling
    console.warn(`[SMS Service] Network error connecting to SMS gateway: ${err.message}`);
    return {
      success: false,
      error: 'SMS gateway is unavailable. Make sure the Android gateway is running and connected to the same network.'
    };
  }
}

module.exports = {
  sendSms,
  normalizePhoneNumber,
  maskPhoneNumber
};
