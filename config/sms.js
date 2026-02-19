const https = require('https');
require('dotenv').config();

console.log('📱 SMS Service Init (Fast2SMS):');
console.log('   API Key:', process.env.FAST2SMS_API_KEY ? '***[Set]' : '❌ [Missing]');

// Function to send OTP via Fast2SMS
async function sendOtpSms(phoneNumber, otp) {
  return new Promise((resolve, reject) => {
    try {
      // Remove +91 or other prefixes if present, Fast2SMS expects 10 digits for India usually, 
      // but their API documentation says "integers" for numbers. 
      // Safest is to strip non-digit characters and take the last 10 digits for India.
      let cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

      const apiKey = process.env.FAST2SMS_API_KEY;

      if (!apiKey) {
        console.error('❌ Fast2SMS API Key is missing in .env');
        return resolve({ success: false, message: 'SMS Configuration Error' });
      }

      const postData = JSON.stringify({
        "route": "otp",
        "variables_values": otp,
        "numbers": cleanPhone,
      });

      const options = {
        method: 'POST',
        hostname: 'www.fast2sms.com',
        port: null,
        path: '/dev/bulkV2',
        headers: {
          "authorization": apiKey,
          "Content-Type": "application/json",
          "Content-Length": postData.length
        }
      };

      console.log(`📱 Sending OTP ${otp} to ${cleanPhone} via Fast2SMS...`);

      const req = https.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function () {
          const body = Buffer.concat(chunks);
          const responseString = body.toString();
          console.log('📨 Fast2SMS Response:', responseString);

          try {
            const responseData = JSON.parse(responseString);
            // Fast2SMS returns "return": true on success
            if (responseData.return) {
              console.log('✓ SMS sent successfully');
              resolve({ success: true, message: 'SMS sent successfully' });
            } else {
              console.error('❌ Fast2SMS Error:', responseData.message);
              resolve({ success: false, message: 'Failed to send SMS: ' + responseData.message });
            }
          } catch (e) {
            console.error('❌ Failed to parse SMS response:', e.message);
            resolve({ success: false, message: 'SMS Provider Error' });
          }
        });
      });

      req.on('error', (e) => {
        console.error('❌ HTTP Request Error:', e.message);
        resolve({ success: false, message: 'Network Error calling SMS Provider' });
      });

      req.write(postData);
      req.end();

    } catch (error) {
      console.error('❌ Error in sendOtpSms:', error.message);
      resolve({ success: false, message: 'Internal SMS Error' });
    }
  });
}

module.exports = { sendOtpSms };
