require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clean-city-reporter')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/complaint', require('./routes/complaint'));
app.use('/api/municipality', require('./routes/municipality'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

app.get('/municipality-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'municipality-dashboard.html'));
});

// Diagnostic Route for Email Debugging
app.get('/api/test-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email parameter required (e.g. ?email=your@email.com)' });

  try {
    const { sendOtpEmail } = require('./config/email');
    console.log(`Diagnostic: Attempting to send test email to ${email}`);

    // Check env vars availability
    const envCheck = {
      BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST || 'MISSING',
      BREVO_SMTP_USER: process.env.BREVO_SMTP_USER ? 'SET' : 'MISSING',
      BREVO_SMTP_PASSWORD: process.env.BREVO_SMTP_PASSWORD ? 'SET' : 'MISSING',
      BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL || 'MISSING',
      PORT: process.env.PORT || '5000'
    };

    const result = await sendOtpEmail(email, 'TEST-123456');

    res.json({
      message: 'Email test executed',
      env_status: envCheck,
      result: result
    });
  } catch (err) {
    console.error('Diagnostic Error:', err);
    res.status(500).json({
      error: 'Diagnostic failed',
      details: err.message,
      stack: err.stack
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
