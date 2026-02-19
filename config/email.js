const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Brevo Email Service Init:');
console.log('   SMTP Host:', process.env.BREVO_SMTP_HOST || '❌ [Missing]');
console.log('   SMTP User:', process.env.BREVO_SMTP_USER ? '***[Set]' : '❌ [Missing]');
console.log('   SMTP Password:', process.env.BREVO_SMTP_PASSWORD ? '***[Set]' : '❌ [Missing]');
console.log('   From Email:', process.env.BREVO_FROM_EMAIL || '❌ [Missing]');

// Create email transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT) || 465, // Changed default to 465 (SSL)
  secure: parseInt(process.env.BREVO_SMTP_PORT) !== 587, // true for 465 (default), false for 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASSWORD
  }
});

// Verify transporter credentials
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Brevo email service verification failed:', error.message);
  } else {
    console.log('✓ Brevo email service ready');
  }
});

// Function to send OTP email
async function sendOtpEmail(email, otp) {
  try {
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASSWORD) {
      return { success: false, message: 'Brevo SMTP credentials not configured', error: 'Missing credentials' };
    }

    console.log(`📧 Attempting to send email OTP to: ${email}`);

    const mailOptions = {
      from: `${process.env.BREVO_FROM_NAME || 'Clean City Reporter'} <${process.env.BREVO_FROM_EMAIL}>`,
      to: email,
      subject: 'Clean City Reporter - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🌿 Clean City Reporter</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 2rem; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Email Verification Required</h2>
            
            <p style="color: #666; font-size: 1rem;">Hello,</p>
            
            <p style="color: #666; font-size: 1rem;">
              Your OTP for email verification is:
            </p>
            
            <div style="background: white; border: 2px solid #27ae60; border-radius: 8px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
              <p style="font-size: 0.9rem; color: #666; margin: 0 0 0.5rem 0;">One-Time Password</p>
              <p style="font-size: 2.5rem; font-weight: bold; color: #27ae60; margin: 0; letter-spacing: 5px;">${otp}</p>
            </div>
            
            <p style="color: #999; font-size: 0.9rem;">
              ⏰ This OTP expires in <strong>5 minutes</strong>
            </p>
            
            <p style="color: #666; font-size: 1rem;">
              Do not share this code with anyone. Clean City Reporter will never ask for your OTP.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 2rem 0;">
            
            <p style="color: #999; font-size: 0.85rem; text-align: center;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    console.error('   Full Error:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
}

module.exports = { sendOtpEmail };
