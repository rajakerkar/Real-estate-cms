const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-cms')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create new admin user
      const adminUser = new User({
        username: 'admin',
        password: 'admin123' // This will be hashed by the pre-save hook
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
};

// Create sample room
const createSampleRoom = async () => {
  try {
    // Check if any rooms exist
    const roomCount = await Room.countDocuments();

    if (roomCount > 0) {
      console.log('Sample rooms already exist');
      return;
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create sample room
    const sampleRoom = new Room({
      category: 'Villa',
      title: 'Luxury Villa with Pool',
      description: 'A beautiful luxury villa with a private pool, 5 bedrooms, and a stunning view of the mountains. Perfect for families or groups looking for a peaceful retreat.',
      location: 'Beverly Hills, CA',
      price: 12500000, // 1.25 crore INR
      size: '4500 sq ft',
      status: 'available',
      rentalStatus: 'for-rent',
      monthlyRent: 85000, // 85,000 INR per month
      agentDetails: {
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@realestate.com',
        company: 'Premium Real Estate Ltd.'
      },
      images: [
        {
          path: 'https://res.cloudinary.com/dtyn5clgu/image/upload/v1713022800/real-estate/sample-villa_ixzjvt.jpg',
          caption: 'Front view of the luxury villa with swimming pool',
          cloudinary_id: 'real-estate/sample-villa_ixzjvt'
        }
      ]
    });

    await sampleRoom.save();
    console.log('Sample room created successfully');
  } catch (error) {
    console.error('Error creating sample room:', error);
  }
};

// Run the seeding functions
const seedDatabase = async () => {
  try {
    const adminCreated = await createAdminUser();

    if (adminCreated) {
      await createSampleRoom();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
};

seedDatabase();
