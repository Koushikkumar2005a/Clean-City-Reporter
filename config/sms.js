const twilio = require('twilio');
require('dotenv').config();

console.log('📱 SMS Service Init (Twilio):');
console.log('   Account SID:', process.env.TWILIO_ACCOUNT_SID ? '***[Set]' : '❌ [Missing]');
console.log('   Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '***[Set]' : '❌ [Missing]');
console.log('   From Number:', process.env.TWILIO_PHONE_NUMBER || '❌ [Missing]');

// Function to send OTP via Twilio
async function sendOtpSms(phoneNumber, otp) {
  try {
    // DEVELOPMENT MODE: Simulate SMS
    if (process.env.NODE_ENV === 'development') {
      console.log('==================================================');
      console.log(`📱 SIMULATED SMS TO: ${phoneNumber}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log('==================================================');
      return { success: true, message: 'SMS sent successfully (Simulated)' };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Twilio credentials missing in .env');
      return { success: false, message: 'SMS Configuration Error' };
    }

    const client = twilio(accountSid, authToken);

    // Ensure E.164 format (default to +91 for India if missing)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    console.log(`📱 Sending OTP ${otp} to ${formattedPhone} via Twilio...`);

    const message = await client.messages.create({
      body: `Your Clean City Reporter OTP is: ${otp}`,
      from: fromNumber,
      to: formattedPhone
    });

    console.log(`✓ SMS sent successfully. SID: ${message.sid}`);
    return { success: true, message: 'SMS sent successfully' };

  } catch (error) {
    console.error('❌ Error in sendOtpSms:', error.message);
    // Development/Demo fallback if Twilio fails (e.g., unverified number in trial)
    if (process.env.NODE_ENV === 'development' || error.code === 21608) {
      console.log('⚠️ Twilio Error encountered. Using CONSOLE ONLY mode as fallback.');
      console.log('==================================================');
      console.log(`🔐 SIMULATED SMS TO: ${phoneNumber}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log('==================================================');
      return { success: true, message: 'SMS sent (Simulated Fallback)' };
    }
    return { success: false, message: 'Failed to send SMS', error: error.message };
  }
}

module.exports = { sendOtpSms };
