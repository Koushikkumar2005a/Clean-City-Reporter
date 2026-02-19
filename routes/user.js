const express = require('express');
const router = express.Router();
const { authUser } = require('../middleware/auth');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
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

router.get('/profile', authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update User Profile
router.put('/profile', authUser, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;

    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user account
router.delete('/delete-account', authUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Attempting to delete user:', userId);
    
    // Get user to access profile picture
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for deletion');
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's profile picture if exists
    if (user.profilePicture) {
      const profilePicPath = path.join(__dirname, '..', 'public', 'uploads', user.profilePicture);
      fs.unlink(profilePicPath, (err) => {
        if (err) console.error('Error deleting profile picture:', err);
        else console.log('Profile picture deleted successfully');
      });
    }

    // Get all complaints from this user
    const complaints = await Complaint.find({ userId });
    console.log('Found', complaints.length, 'complaints to delete');
    
    // Delete complaint images from storage
    complaints.forEach(complaint => {
      if (complaint.image) {
        const imagePath = path.join(__dirname, '..', 'public', 'uploads', complaint.image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting complaint image:', err);
          else console.log('Complaint image deleted:', complaint.image);
        });
      }
    });

    // Delete all complaints from this user
    const complaintDeleteResult = await Complaint.deleteMany({ userId });
    console.log('Deleted', complaintDeleteResult.deletedCount, 'complaints');

    // Delete user account using deleteOne to be explicit
    const deleteResult = await User.deleteOne({ _id: userId });
    console.log('User deletion result:', deleteResult.deletedCount, 'documents deleted');
    
    // Verify user is actually deleted
    const verifyDelete = await User.findById(userId);
    if (verifyDelete) {
      console.log('ERROR: User still exists after deletion!');
      return res.status(500).json({ message: 'Error: Failed to delete user account' });
    }
    
    console.log('User successfully deleted:', userId);
    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
