const twilio = require('twilio');
require('dotenv').config();

console.log('📱 SMS Service Init:');
console.log('   Account SID:', process.env.TWILIO_ACCOUNT_SID ? '***[Set]' : '❌ [Missing]');
console.log('   Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '***[Set]' : '❌ [Missing]');
console.log('   From Phone:', process.env.TWILIO_PHONE_NUMBER || '❌ [Missing]');

// Initialize Twilio client
let twilioClient;
try {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✓ Twilio client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Twilio:', error.message);
}

// Function to send OTP via SMS
async function sendOtpSms(phoneNumber, otp) {
  try {
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhone = '+91' + phoneNumber;
    }

    console.log(`📱 Attempting to send SMS OTP to: ${formattedPhone}`);

    const message = await twilioClient.messages.create({
      body: `Your Clean City Reporter OTP is: ${otp}\n\nThis OTP expires in 5 minutes. Do not share it with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✓ SMS OTP sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return { success: true, message: 'SMS sent successfully', messageSid: message.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    console.error('   Full Error:', JSON.stringify(error, null, 2));
    return { success: false, message: 'Failed to send SMS', error: error.message };
  }
}

module.exports = { sendOtpSms };
