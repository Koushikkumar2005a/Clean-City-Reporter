require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Municipality = require('./models/Municipality');
const Complaint = require('./models/Complaint');
const fs = require('fs');
const path = require('path');

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clean-city-reporter');
    console.log('Connected to MongoDB');

    // Delete all files in uploads folder
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
      console.log(`Deleted ${files.length} files from uploads folder`);
    }

    // Clear collections
    const userDeleteResult = await User.deleteMany({});
    console.log(`Deleted ${userDeleteResult.deletedCount} users`);

    const municipalityDeleteResult = await Municipality.deleteMany({});
    console.log(`Deleted ${municipalityDeleteResult.deletedCount} municipalities`);

    const complaintDeleteResult = await Complaint.deleteMany({});
    console.log(`Deleted ${complaintDeleteResult.deletedCount} complaints`);

    console.log('\n✅ Database cleared successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearDatabase();
