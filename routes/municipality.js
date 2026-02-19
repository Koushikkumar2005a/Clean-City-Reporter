const express = require('express');
const router = express.Router();
const { authMunicipality } = require('../middleware/auth');
const Municipality = require('../models/Municipality');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/profile', authMunicipality, async (req, res) => {
  try {
    const municipality = await Municipality.findById(req.municipality.id).select('-password');
    if (!municipality) {
      return res.status(404).json({ message: 'Municipality not found' });
    }
    res.json(municipality);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Municipality Profile
router.put('/profile', authMunicipality, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, location } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (location) updateData.location = location;

    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const municipality = await Municipality.findByIdAndUpdate(req.municipality.id, updateData, { new: true }).select('-password');
    res.json({ message: 'Profile updated successfully', municipality });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Block User
router.post('/block-user/:userId', authMunicipality, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block user
    await User.findByIdAndUpdate(userId, { 
      isBlocked: true,
      $push: { blockedBy: req.municipality.id }
    });

    // Add user to municipality's blockedUsers list
    await Municipality.findByIdAndUpdate(req.municipality.id, {
      $push: { blockedUsers: userId }
    });

    res.json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Blocked Users
router.get('/blocked-users', authMunicipality, async (req, res) => {
  try {
    const municipality = await Municipality.findById(req.municipality.id).populate('blockedUsers', 'name email phone');
    res.json(municipality.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Unblock User
router.post('/unblock-user/:userId', authMunicipality, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Unblock user
    await User.findByIdAndUpdate(userId, {
      isBlocked: false,
      $pull: { blockedBy: req.municipality.id }
    });

    // Remove user from municipality's blockedUsers list
    await Municipality.findByIdAndUpdate(req.municipality.id, {
      $pull: { blockedUsers: userId }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete municipality account
router.delete('/delete-account', authMunicipality, async (req, res) => {
  try {
    const municipalityId = req.municipality.id;
    
    // Get municipality to access profile picture
    const municipality = await Municipality.findById(municipalityId);
    if (!municipality) {
      return res.status(404).json({ message: 'Municipality not found' });
    }

    // Delete municipality's profile picture if exists
    if (municipality.profilePicture) {
      const profilePicPath = path.join(__dirname, '..', 'public', 'uploads', municipality.profilePicture);
      fs.unlink(profilePicPath, (err) => {
        if (err) console.error('Error deleting profile picture:', err);
      });
    }

    // Delete municipality account
    await Municipality.findByIdAndDelete(municipalityId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
