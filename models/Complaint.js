const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  zone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Not Started', 'Processing', 'Completed'],
    default: 'Not Started'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Municipality',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
