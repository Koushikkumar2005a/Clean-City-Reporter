const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Municipality = require('../models/Municipality');
const { sendOtpEmail } = require('../config/email');
const { sendOtpSms } = require('../config/sms');

const otpStore = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/user-signup', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, address, zone, latitude, longitude } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword || !address || !zone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure both Email and Phone OTP verified
    const record = otpStore[email];
    if (!record || !record.emailOtp || !record.phoneOtp) {
      return res.status(400).json({ message: 'OTP not setup. Please request OTP for email and phone first.' });
    }
    if (!record.emailOtp.verified || !record.phoneOtp.verified) {
      return res.status(400).json({ message: 'Please verify both email and phone OTP before registering.' });
    }

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      zone,
      latitude,
      longitude
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message, error: err.message });
  }
});

// Municipality Signup
router.post('/municipality-signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, regNumber, location } = req.body;

    if (!name || !email || !password || !confirmPassword || !regNumber || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate registration number
    const validRegNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    if (!validRegNumbers.includes(regNumber)) {
      return res.status(400).json({ message: 'Invalid registration number. Valid numbers are 01-10' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingMun = await Municipality.findOne({ email });
    if (existingMun) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingRegNumber = await Municipality.findOne({ regNumber });
    if (existingRegNumber) {
      return res.status(400).json({ message: 'Registration number already exists' });
    }

    // Ensure Email OTP verified for municipality
    const record = otpStore[email];
    if (!record || !record.emailOtp || !record.emailOtp.verified) {
      return res.status(400).json({ message: 'Email OTP not verified. Please verify your email OTP first.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const municipality = new Municipality({
      name,
      email,
      password: hashedPassword,
      regNumber,
      location
    });

    await municipality.save();
    res.status(201).json({ message: 'Municipality registered successfully', munId: municipality._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// User Login
router.post('/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by municipality. Please contact municipality office.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({ message: 'Login successful', token, userId: user._id, userType: 'user' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Send OTP to email and phone
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, type } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!type || (type !== 'email' && type !== 'phone')) {
      return res.status(400).json({ message: 'Type must be either "email" or "phone"' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    if (!otpStore[email]) {
      otpStore[email] = { phone: phone || null, emailOtp: null, phoneOtp: null };
    }

    if (type === 'email') {
      otpStore[email].emailOtp = { otp, expiresAt, verified: false };

      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        return res.status(500).json({ message: emailResult.message || 'Failed to send email' });
      }

      res.json({ message: 'OTP sent to your email' });
    } else if (type === 'phone') {
      otpStore[email].phone = phone || otpStore[email].phone;
      otpStore[email].phoneOtp = { otp, expiresAt, verified: false };

      const smsResult = await sendOtpSms(phone, otp);
      if (!smsResult.success) {
        return res.status(500).json({ message: smsResult.message || 'Failed to send SMS' });
      }

      res.json({ message: 'OTP sent to your phone' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    if (!type || (type !== 'email' && type !== 'phone')) {
      return res.status(400).json({ message: 'Type must be either "email" or "phone"' });
    }

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'No OTP requested for this email' });

    let otpData = type === 'email' ? record.emailOtp : record.phoneOtp;
    if (!otpData) {
      return res.status(400).json({ message: `No ${type} OTP requested` });
    }

    if (Date.now() > otpData.expiresAt) {
      if (type === 'email') {
        record.emailOtp = null;
      } else {
        record.phoneOtp = null;
      }
      return res.status(400).json({ message: 'OTP expired, please request again' });
    }

    if (otpData.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpData.verified = true;
    res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} OTP verified successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Municipality Login
router.post('/municipality-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const municipality = await Municipality.findOne({ email });
    if (!municipality) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, municipality.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: municipality._id, email: municipality.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({ message: 'Login successful', token, municipalityId: municipality._id, userType: 'municipality' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check if email exists (for real-time validation)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ exists: false });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    const munExists = await Municipality.findOne({ email: email.toLowerCase() });

    if (userExists || munExists) {
      return res.json({ exists: true });
    }

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check if phone exists (for real-time validation)
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ exists: false });
    }

    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.json({ exists: true });
    }

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
