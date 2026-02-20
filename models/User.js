const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    required: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  profilePicture: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  zone: {
    type: String,
    required: true
  },
  blockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Municipality'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
