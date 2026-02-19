const express = require('express');
const router = express.Router();
const { authUser, authMunicipality } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Municipality = require('../models/Municipality');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/register', authUser, upload.single('image'), async (req, res) => {
  try {
    const { description, latitude, longitude, zone } = req.body;

    if (!latitude || !longitude || !req.file) {
      return res.status(400).json({ message: 'Location (GPS) and image are required' });
    }

    // Find municipality in the same zone to assign this complaint
    let assignedMunicipality = null;
    if (zone) {
      // Extract zone number from "Zone X" format
      const zoneNumber = zone.split(' ')[1];
      if (zoneNumber) {
        // Find municipality with registration number matching zone number (padded to 2 digits)
        const regNumber = String(zoneNumber).padStart(2, '0');
        assignedMunicipality = await Municipality.findOne({ regNumber });
      }
    }

    const complaint = new Complaint({
      userId: req.user.id,
      description: description || '',
      image: req.file.filename,
      latitude,
      longitude,
      zone: zone || '',
      assignedTo: assignedMunicipality ? assignedMunicipality._id : null
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint registered successfully', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/my-complaints', authUser, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id }).populate('userId', 'name email phone');
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Complaint Status
router.get('/status/:id', authUser, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email phone').populate('assignedTo', 'name location');
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Municipality Complaints
router.get('/new-complaints', authMunicipality, async (req, res) => {
  try {
    // Get complaints from today assigned to this municipality
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const complaints = await Complaint.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'Not Started',
      assignedTo: req.municipality.id
    }).populate('userId', 'name email phone address profilePicture').populate('assignedTo', 'name');

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Unsolved Complaints (more than 24 hours old)
router.get('/unsolved-complaints', authMunicipality, async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const complaints = await Complaint.find({
      createdAt: { $lt: oneDayAgo },
      status: { $ne: 'Completed' },
      assignedTo: req.municipality.id
    }).populate('userId', 'name email phone address profilePicture').populate('assignedTo', 'name');

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Processing Complaints
router.get('/processing-complaints', authMunicipality, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: 'Processing',
      assignedTo: req.municipality.id
    }).populate('userId', 'name email phone address profilePicture').populate('assignedTo', 'name');

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Solved Complaints (History)
router.get('/history', authMunicipality, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      status: 'Completed',
      assignedTo: req.municipality.id
    }).populate('userId', 'name email phone address profilePicture').populate('assignedTo', 'name');

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Complaint Status (Municipality)
router.put('/update-status/:id', authMunicipality, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Not Started', 'Processing', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, assignedTo: req.municipality.id, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'name email phone address profilePicture').populate('assignedTo', 'name');

    res.json({ message: 'Status updated successfully', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Complaint Details
router.get('/details/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email phone address profilePicture')
      .populate('assignedTo', 'name location');
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
