const User = require('../models/User');
const Room = require('../models/Room');
const Company = require('../models/Company');
const { SubscriptionPlan, CompanySubscription } = require('../models/Subscription');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// Login page
exports.getLoginPage = (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null
  });
};

// Process login - only use hardcoded admin credentials
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password });

    // Direct admin login with hardcoded credentials
    if (username === 'admin' && password === 'admin123') {
      // Set session
      req.session.user = {
        username: 'admin',
        isAdmin: true
      };

      // Redirect to dashboard or original destination
      const redirectUrl = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;

      console.log('Admin login successful, redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // If credentials don't match, show error
    return res.render('admin/login', {
      title: 'Admin Login',
      error: 'Invalid username or password'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', {
      title: 'Admin Login',
      error: 'An error occurred during login'
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
};

// Admin dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Verify admin access again as an extra security measure
    if (!req.session.user || req.session.user.username !== 'admin') {
      return res.redirect('/admin/login');
    }

    // Get counts for dashboard
    const roomCount = await Room.countDocuments();
    const companyCount = await Company.countDocuments();
    const activeSubscriptionCount = await CompanySubscription.countDocuments({
      isActive: true,
      endDate: { $gte: new Date() }
    });
    const pendingSubscriptionCount = await CompanySubscription.countDocuments({
      paymentStatus: 'pending'
    });

    // Get recent rooms
    const recentRooms = await Room.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('company', 'name');

    // Get recent companies
    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent subscriptions
    const recentSubscriptions = await CompanySubscription.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('company', 'name')
      .populate('plan', 'name');

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        roomCount,
        companyCount,
        activeSubscriptionCount,
        pendingSubscriptionCount
      },
      recentRooms,
      recentCompanies,
      recentSubscriptions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard'
    });
  }
};

// Add room form
exports.getAddRoomForm = (req, res) => {
  res.render('admin/add-room', {
    title: 'Add New Room',
    error: null
  });
};

// Process add room
exports.addRoom = async (req, res) => {
  try {
    const { category, title, description, location, price, size, status, rentalStatus, monthlyRent, captions, agentDetails } = req.body;

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.render('admin/add-room', {
        title: 'Add New Room',
        error: 'At least one image is required',
        formData: req.body
      });
    }

    // Process images with captions
    const images = [];

    // Upload each image to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Get caption if available
        const caption = Array.isArray(captions) ? captions[index] || '' : captions || '';

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file.path, 'real-estate');

        // Add image with caption
        images.push({
          path: result.secure_url,
          caption: caption,
          cloudinary_id: result.public_id
        });
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error);
        throw error;
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Create new room
    const newRoom = new Room({
      category,
      title,
      description,
      location,
      price,
      size,
      status: status || 'available',
      rentalStatus: rentalStatus || 'not-for-rent',
      monthlyRent: rentalStatus === 'for-rent' ? monthlyRent : 0,
      agentDetails,
      images
    });

    await newRoom.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Add room error:', error);
    res.render('admin/add-room', {
      title: 'Add New Room',
      error: 'Failed to add room',
      formData: req.body
    });
  }
};

// Edit room form
exports.getEditRoomForm = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    res.render('admin/edit-room', {
      title: 'Edit Room',
      room,
      error: null
    });
  } catch (error) {
    console.error('Edit room form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load room data'
    });
  }
};

// Process edit room
exports.updateRoom = async (req, res) => {
  try {
    console.log('Update Room Request:', {
      method: req.method,
      originalMethod: req.originalMethod,
      path: req.path,
      params: req.params,
      body: req.body
    });
    const {
      category, title, description, location, price, size, status,
      rentalStatus, monthlyRent, captions, existingCaptions, agentDetails
    } = req.body;

    // Find room
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    // Update room data
    room.category = category;
    room.title = title;
    room.description = description;
    room.location = location;
    room.price = price;
    room.size = size;
    room.status = status;
    room.rentalStatus = rentalStatus;
    room.monthlyRent = rentalStatus === 'for-rent' ? monthlyRent : 0;

    // Update agent details
    if (agentDetails) {
      room.agentDetails = agentDetails;
    }

    // Update existing image captions if provided
    if (existingCaptions) {
      // Convert to array if it's not already
      const captionsArray = Array.isArray(existingCaptions) ? existingCaptions : [existingCaptions];

      // Update captions for existing images
      room.images.forEach((image, index) => {
        if (captionsArray[index] !== undefined) {
          image.caption = captionsArray[index];
        }
      });
    }

    // Add new images with captions if uploaded
    if (req.files && req.files.length > 0) {
      // Upload each new image to Cloudinary
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          // Get caption if available
          const caption = Array.isArray(captions) ? captions[index] || '' : captions || '';

          // Upload to Cloudinary
          const result = await uploadToCloudinary(file.path, 'real-estate');

          // Add image with caption
          return {
            path: result.secure_url,
            caption: caption,
            cloudinary_id: result.public_id
          };
        } catch (error) {
          console.error(`Error uploading image ${index}:`, error);
          throw error;
        }
      });

      // Wait for all uploads to complete
      const newImages = await Promise.all(uploadPromises);

      // Add new images to existing ones
      room.images = [...room.images, ...newImages];
    }

    await room.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Update room error:', error);

    // Try to get the room again for the form
    try {
      const room = await Room.findById(req.params.id);
      if (room) {
        return res.render('admin/edit-room', {
          title: 'Edit Room',
          room,
          error: `Failed to update room: ${error.message}`
        });
      }
    } catch (secondaryError) {
      console.error('Secondary error when fetching room:', secondaryError);
    }

    // Fallback to generic error page
    res.status(500).render('error', {
      title: 'Error',
      message: `Failed to update room: ${error.message}`
    });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    // Delete associated images from Cloudinary
    for (const image of room.images) {
      if (image.cloudinary_id) {
        try {
          await cloudinary.uploader.destroy(image.cloudinary_id);
          console.log(`Deleted image from Cloudinary: ${image.cloudinary_id}`);
        } catch (error) {
          console.error(`Error deleting image from Cloudinary: ${image.cloudinary_id}`, error);
          // Continue with deletion from database even if Cloudinary deletion fails
        }
      } else if (image.path && image.path.startsWith('/uploads/')) {
        // For legacy images stored in the filesystem
        const fullImagePath = path.join(__dirname, '../public', image.path);
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
        }
      }
    }

    // Delete room from database
    await Room.findByIdAndDelete(req.params.id);

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete room'
    });
  }
};

// Toggle room status
exports.toggleRoomStatus = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    // Toggle status
    room.status = room.status === 'available' ? 'sold' : 'available';

    await room.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to update room status'
    });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { roomId, imageIndex } = req.params;

    const room = await Room.findById(roomId);

    if (!room || !room.images[imageIndex]) {
      return res.status(404).render('404', { title: 'Not Found' });
    }

    // Get image data
    const image = room.images[imageIndex];

    // Delete from Cloudinary if cloudinary_id exists
    if (image.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(image.cloudinary_id);
        console.log(`Deleted image from Cloudinary: ${image.cloudinary_id}`);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary: ${image.cloudinary_id}`, error);
        // Continue with deletion from database even if Cloudinary deletion fails
      }
    } else {
      // For legacy images stored in the filesystem
      const imagePath = image.path;
      if (imagePath.startsWith('/uploads/')) {
        const fullImagePath = path.join(__dirname, '../public', imagePath);
        if (fs.existsSync(fullImagePath)) {
          fs.unlinkSync(fullImagePath);
        }
      }
    }

    // Remove from room.images array
    room.images.splice(imageIndex, 1);

    await room.save();

    res.redirect(`/admin/rooms/edit/${roomId}`);
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete image'
    });
  }
};

// Company Management

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    res.render('admin/companies', {
      title: 'All Companies',
      companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load companies'
    });
  }
};

// Get company details
exports.getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).render('404', { title: 'Company Not Found' });
    }

    // Get company rooms
    const rooms = await Room.find({ company: company._id }).sort({ createdAt: -1 });

    // Get company subscriptions
    const subscriptions = await CompanySubscription.find({ company: company._id })
      .populate('room')
      .sort({ createdAt: -1 });

    res.render('admin/company-details', {
      title: `Company: ${company.name}`,
      company,
      rooms,
      subscriptions,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Company details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load company details'
    });
  }
};

// Toggle company status
exports.toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      req.flash('error', 'Company not found');
      return res.redirect('/admin/companies');
    }

    // Toggle status
    company.isActive = !company.isActive;

    await company.save();

    req.flash('success', `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`);
    res.redirect(`/admin/companies/${req.params.id}`);
  } catch (error) {
    console.error('Toggle company status error:', error);
    req.flash('error', 'Failed to update company status');
    res.redirect(`/admin/companies/${req.params.id}`);
  }
};
