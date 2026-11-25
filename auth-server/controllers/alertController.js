const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSms, maskPhoneNumber, normalizePhoneNumber } = require('../services/smsService');

const SIMULATION_HEADER = 'JALRAKSHAK SIMULATION / DEMO ALERT';

/**
 * Builds demo SMS content for Flash Flood simulation.
 */
function buildFlashFloodSms(data) {
  const risk = (data.risk || 'CRITICAL').toUpperCase();
  const location = data.locationName ? `Location: ${data.locationName}\n` : '';
  const rainfall = data.rainfall !== undefined ? `${data.rainfall} mm/h` : '115 mm/h';
  const soilMoisture = data.soilMoisture !== undefined ? `${data.soilMoisture}%` : '94%';
  const waterLevel = data.waterLevel !== undefined ? data.waterLevel : 'CRITICAL';

  // Build nearest safe location link using alert coordinates (preferred) or location name
  let safeLocationLink;
  if (data.latitude !== undefined && data.longitude !== undefined) {
    safeLocationLink = `https://www.google.com/maps/search/emergency+shelter/@${data.latitude},${data.longitude},14z`;
  } else if (data.locationName) {
    const q = encodeURIComponent(`emergency shelter near ${data.locationName}`);
    safeLocationLink = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else {
    safeLocationLink = `https://www.google.com/maps/search/emergency+shelter`;
  }

  return `${SIMULATION_HEADER}:
FLASH FLOOD RISK ${risk}.
${location}Rainfall: ${rainfall}
Soil moisture: ${soilMoisture}
Water level: ${waterLevel}
Risk: ${risk}.
📍 Nearest Safe Location: ${safeLocationLink}
Demo only. Follow local official emergency instructions.`;
}

/**
 * Builds demo SMS content for Street Waterlogging simulation.
 */
function buildWaterloggingSms(data) {
  const risk = (data.risk || 'SEVERE').toUpperCase();
  const road = data.roadName ? `Road: ${data.roadName}\n` : '';
  const rainfall = data.rainfall !== undefined ? `${data.rainfall} mm/h` : '85 mm/h';
  const drainageRisk = data.drainageRisk || 'RESTRICTED';
  const diagnosis = data.diagnosis || 'High runoff overloading storm culvert';

  return `${SIMULATION_HEADER}:
${risk} STREET WATERLOGGING.
${road}Rainfall: ${rainfall}
Drainage risk: ${drainageRisk}
Diagnosis: ${diagnosis}
Demo only. Avoid the affected road and follow local official instructions.`;
}

/**
 * Sanitizes and formats SMS message, enforcing DEMO safety label.
 */
function prepareAlertMessage(body) {
  const type = body.type || 'flash_flood';

  if (body.message && typeof body.message === 'string' && body.message.trim()) {
    let custom = body.message.trim();
    if (!custom.includes(SIMULATION_HEADER)) {
      custom = `${SIMULATION_HEADER}:\n${custom}`;
    }
    return custom;
  }

  if (type === 'waterlogging') {
    return buildWaterloggingSms(body);
  }

  return buildFlashFloodSms(body);
}

/**
 * @desc    Trigger simulated disaster SMS alert via Traccar Gateway
 * @route   POST /api/alerts/trigger
 * @access  Private (JWT Required)
 */
const triggerAlert = async (req, res) => {
  try {
    const { type = 'flash_flood' } = req.body;

    const locationLabel = type === 'waterlogging'
      ? (req.body.roadName || req.body.locationName || 'selected location')
      : (req.body.locationName || 'selected location');

    // Send to ALL registered users — no location cross-check
    const matchedUsers = await User.find({}).select('phone location name').lean();

    if (matchedUsers.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No registered users found in the system.',
        type,
      });
    }

    // Build the alert message once
    const finalMessage = prepareAlertMessage(req.body);

    // Send SMS to every matched user in parallel
    const results = await Promise.allSettled(
      matchedUsers.map(async (u) => {
        const normalizedPhone = normalizePhoneNumber(u.phone);
        if (!normalizedPhone) return { skipped: true, phone: u.phone };

        const smsResult = await sendSms(normalizedPhone, finalMessage);

        // Persist notification record
        try {
          await Notification.create({
            userId: u._id,
            phone: normalizedPhone,
            type: type === 'waterlogging' ? 'waterlogging' : 'flash_flood',
            message: finalMessage,
            status: smsResult.success ? 'sent' : 'failed',
            createdAt: new Date(),
          });
        } catch (dbErr) {
          console.error('[Notification Save Error]', dbErr.message);
        }

        return { ...smsResult, phone: normalizedPhone };
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const total = matchedUsers.length;
    const displayLocation = locationLabel || 'selected location';

    return res.status(200).json({
      success: sent > 0,
      message: sent > 0
        ? `Alert sent to ${sent} of ${total} user${total !== 1 ? 's' : ''} in ${displayLocation}.`
        : `SMS gateway unavailable. Found ${total} user${total !== 1 ? 's' : ''} in ${displayLocation} but could not deliver.`,
      type,
      sentCount: sent,
      totalMatched: total,
    });
  } catch (error) {
    console.error('[Alert Trigger Server Error]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing alert dispatch.',
    });
  }
};

/**
 * @desc    Development-only test SMS endpoint
 * @route   POST /api/alerts/test-sms
 * @access  Private (JWT Required)
 */
const testSms = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_SMS === 'true';
    if (!isDev) {
      return res.status(403).json({
        success: false,
        message: 'Test SMS endpoint is disabled in production environments.',
      });
    }

    const rawTargetPhone = req.user && req.user.phone;
    if (!rawTargetPhone) {
      return res.status(400).json({
        success: false,
        message: 'No registered mobile number associated with your account.',
      });
    }

    const normalizedTargetPhone = normalizePhoneNumber(rawTargetPhone);
    const testMessage = `${SIMULATION_HEADER}: Test SMS successful.`;

    const smsResult = await sendSms(normalizedTargetPhone, testMessage);

    try {
      await Notification.create({
        userId: req.user._id,
        phone: normalizedTargetPhone,
        type: 'test',
        message: testMessage,
        status: smsResult.success ? 'sent' : 'failed',
        createdAt: new Date(),
      });
    } catch (dbErr) {
      console.error('[Notification History Save Error]', dbErr.message);
    }

    if (!smsResult.success) {
      return res.status(502).json({
        success: false,
        message: smsResult.error || 'SMS gateway is unavailable.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test SMS successfully sent to your registered phone.',
      recipient: maskPhoneNumber(normalizedTargetPhone),
    });
  } catch (error) {
    console.error('[Test SMS Error]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while dispatching test SMS.',
    });
  }
};

module.exports = {
  triggerAlert,
  testSms,
  prepareAlertMessage,
};
