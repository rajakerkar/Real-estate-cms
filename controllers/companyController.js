const Company = require('../models/Company');
const Room = require('../models/Room');
const { SubscriptionPlan, CompanySubscription } = require('../models/Subscription');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { razorpay, createOrder, verifyPaymentSignature } = require('../utils/razorpay');

// Company registration page
exports.getRegisterPage = (req, res) => {
  res.render('company/register', {
    title: 'Company Registration',
    error: null,
    formData: {}
  });
};

// Process company registration
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      gstin,
      contactPersonName,
      contactPersonDesignation,
      contactPersonPhone
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.render('company/register', {
        title: 'Company Registration',
        error: 'Passwords do not match',
        formData: req.body
      });
    }

    // Check if company with email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.render('company/register', {
        title: 'Company Registration',
        error: 'Email already registered',
        formData: req.body
      });
    }

    // Process logo if uploaded
    let logoUrl = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'company-logos');
        logoUrl = result.secure_url;
      } catch (error) {
        console.error('Logo upload error:', error);
      }
    }

    // Create new company
    const newCompany = new Company({
      name,
      email,
      password,
      phone,
      address,
      gstin,
      logo: logoUrl,
      contactPerson: {
        name: contactPersonName,
        designation: contactPersonDesignation,
        phone: contactPersonPhone
      }
    });

    await newCompany.save();

    // Redirect to login page
    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/company/login');
  } catch (error) {
    console.error('Company registration error:', error);
    res.render('company/register', {
      title: 'Company Registration',
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

// Company login page
exports.getLoginPage = (req, res) => {
  res.render('company/login', {
    title: 'Company Login',
    error: null
  });
};

// Process company login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find company
    const company = await Company.findOne({ email });

    if (!company) {
      return res.render('company/login', {
        title: 'Company Login',
        error: 'Invalid email or password'
      });
    }

    // Check if company is active
    if (!company.isActive) {
      return res.render('company/login', {
        title: 'Company Login',
        error: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Check password
    const isMatch = await company.comparePassword(password);

    if (!isMatch) {
      return res.render('company/login', {
        title: 'Company Login',
        error: 'Invalid email or password'
      });
    }

    // Set session
    req.session.user = {
      id: company._id,
      name: company.name,
      email: company.email,
      role: 'company'
    };

    // Redirect to dashboard or original destination
    const redirectUrl = req.session.returnTo || '/company/dashboard';
    delete req.session.returnTo;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Company login error:', error);
    res.render('company/login', {
      title: 'Company Login',
      error: 'An error occurred during login'
    });
  }
};

// Company logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/company/login');
  });
};

// Company dashboard
exports.getDashboard = async (req, res) => {
  try {
    const companyId = req.session.user.id;

    // Get company rooms
    const rooms = await Room.find({ company: companyId }).sort({ createdAt: -1 });

    // Get active subscriptions
    const activeSubscriptions = await CompanySubscription.find({
      company: companyId,
      isActive: true,
      endDate: { $gte: new Date() }
    }).populate('plan');

    // Get company subscription status
    const company = await Company.findById(companyId);

    res.render('company/dashboard', {
      title: 'Company Dashboard',
      rooms,
      activeSubscriptions,
      hasActiveSubscription: company.hasActiveSubscription,
      flash: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Company dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard'
    });
  }
};

// Company profile
exports.getProfile = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Company not found'
      });
    }

    res.render('company/profile', {
      title: 'Company Profile',
      company,
      error: null,
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Company profile error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load profile'
    });
  }
};

// Update company profile
exports.updateProfile = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const {
      name,
      phone,
      address,
      gstin,
      contactPersonName,
      contactPersonDesignation,
      contactPersonPhone
    } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Company not found'
      });
    }

    // Process logo if uploaded
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'company-logos');
        company.logo = result.secure_url;
      } catch (error) {
        console.error('Logo upload error:', error);
      }
    }

    // Update company data
    company.name = name;
    company.phone = phone;
    company.address = address;
    company.gstin = gstin;
    company.contactPerson.name = contactPersonName;
    company.contactPerson.designation = contactPersonDesignation;
    company.contactPerson.phone = contactPersonPhone;

    await company.save();

    req.flash('success', 'Profile updated successfully');
    res.redirect('/company/profile');
  } catch (error) {
    console.error('Update profile error:', error);

    try {
      const company = await Company.findById(req.session.user.id);
      res.render('company/profile', {
        title: 'Company Profile',
        company,
        error: 'Failed to update profile',
        success: null
      });
    } catch (secondaryError) {
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to update profile'
      });
    }
  }
};

// Change password page
exports.getChangePasswordPage = (req, res) => {
  res.render('company/change-password', {
    title: 'Change Password',
    error: null,
    success: req.flash('success')
  });
};

// Process change password
exports.changePassword = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.render('company/change-password', {
        title: 'Change Password',
        error: 'New passwords do not match',
        success: null
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Company not found'
      });
    }

    // Check current password
    const isMatch = await company.comparePassword(currentPassword);

    if (!isMatch) {
      return res.render('company/change-password', {
        title: 'Change Password',
        error: 'Current password is incorrect',
        success: null
      });
    }

    // Update password
    company.password = newPassword;
    await company.save();

    req.flash('success', 'Password changed successfully');
    res.redirect('/company/change-password');
  } catch (error) {
    console.error('Change password error:', error);
    res.render('company/change-password', {
      title: 'Change Password',
      error: 'Failed to change password',
      success: null
    });
  }
};

// Add room form
exports.getAddRoomForm = async (req, res) => {
  try {
    // Check if company has active subscription
    const companyId = req.session.user.id;
    const company = await Company.findById(companyId);

    if (!company.hasActiveSubscription) {
      req.flash('error', 'You need an active subscription to add properties');
      return res.redirect('/company/subscription-plans');
    }

    res.render('company/add-room', {
      title: 'Add New Room',
      error: null,
      formData: {},
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Add room form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load form'
    });
  }
};

// Process add room
exports.addRoom = async (req, res) => {
  try {
    const companyId = req.session.user.id;

    // Check if company has active subscription
    const company = await Company.findById(companyId);

    if (!company.hasActiveSubscription) {
      req.flash('error', 'You need an active subscription to add properties');
      return res.redirect('/company/subscription-plans');
    }

    const {
      category,
      title,
      description,
      location,
      price,
      size,
      status,
      rentalStatus,
      monthlyRent,
      captions,
      agentDetails
    } = req.body;

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.render('company/add-room', {
        title: 'Add New Room',
        error: 'At least one image is required',
        formData: req.body,
        success: null
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
      company: companyId,
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

    req.flash('success', 'Property added successfully');
    res.redirect('/company/dashboard');
  } catch (error) {
    console.error('Add room error:', error);

    res.render('company/add-room', {
      title: 'Add New Room',
      error: 'Failed to add room: ' + error.message,
      formData: req.body,
      success: null
    });
  }
};

// Edit room form
exports.getEditRoomForm = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const room = await Room.findOne({
      _id: req.params.id,
      company: companyId
    });

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    res.render('company/edit-room', {
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
    const companyId = req.session.user.id;
    const {
      category, title, description, location, price, size, status,
      rentalStatus, monthlyRent, captions, existingCaptions, agentDetails
    } = req.body;

    // Find room and verify ownership
    const room = await Room.findOne({
      _id: req.params.id,
      company: companyId
    });

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

    res.redirect('/company/dashboard');
  } catch (error) {
    console.error('Update room error:', error);

    try {
      const room = await Room.findOne({
        _id: req.params.id,
        company: req.session.user.id
      });

      if (room) {
        return res.render('company/edit-room', {
          title: 'Edit Room',
          room,
          error: `Failed to update room: ${error.message}`
        });
      }
    } catch (secondaryError) {
      console.error('Secondary error when fetching room:', secondaryError);
    }

    res.status(500).render('error', {
      title: 'Error',
      message: `Failed to update room: ${error.message}`
    });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const room = await Room.findOne({
      _id: req.params.id,
      company: companyId
    });

    if (!room) {
      return res.status(404).render('404', { title: 'Room Not Found' });
    }

    // Check if room has active subscription
    if (room.subscriptionStatus === 'active') {
      return res.status(400).render('error', {
        title: 'Error',
        message: 'Cannot delete room with active subscription'
      });
    }

    // Delete associated images from Cloudinary
    for (const image of room.images) {
      if (image.cloudinary_id) {
        try {
          await cloudinary.uploader.destroy(image.cloudinary_id);
        } catch (error) {
          console.error(`Error deleting image from Cloudinary: ${image.cloudinary_id}`, error);
        }
      }
    }

    // Delete room from database
    await Room.findByIdAndDelete(req.params.id);

    res.redirect('/company/dashboard');
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete room'
    });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const { roomId, imageIndex } = req.params;

    const room = await Room.findOne({
      _id: roomId,
      company: companyId
    });

    if (!room || !room.images[imageIndex]) {
      return res.status(404).render('404', { title: 'Not Found' });
    }

    // Get image data
    const image = room.images[imageIndex];

    // Delete from Cloudinary if cloudinary_id exists
    if (image.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(image.cloudinary_id);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary: ${image.cloudinary_id}`, error);
      }
    }

    // Remove from room.images array
    room.images.splice(imageIndex, 1);

    await room.save();

    res.redirect(`/company/rooms/edit/${roomId}`);
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete image'
    });
  }
};

// Get subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const subscriptionPlans = await SubscriptionPlan.find({ isActive: true });

    // Check if company has an active subscription
    const companyId = req.session.user.id;
    const company = await Company.findById(companyId).populate('currentSubscription');
    const hasActiveSubscription = company.hasActiveSubscription;

    // Get active subscription details if exists
    let activeSubscription = null;
    if (hasActiveSubscription && company.currentSubscription) {
      activeSubscription = company.currentSubscription;
      if (!activeSubscription.plan) {
        activeSubscription = await CompanySubscription.findById(company.currentSubscription)
          .populate('plan');
      }
    }

    res.render('company/subscription-plans', {
      title: 'Subscription Plans',
      subscriptionPlans,
      hasActiveSubscription,
      activeSubscription,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Subscription plans error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load subscription plans'
    });
  }
};

// Subscribe to a plan
exports.subscribeToPlan = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const { planId, duration } = req.body;

    // Validate inputs
    if (!planId || !duration) {
      req.flash('error', 'Please select a plan and duration');
      return res.redirect('/company/subscription-plans');
    }

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      req.flash('error', 'Selected plan is not available');
      return res.redirect('/company/subscription-plans');
    }

    // Calculate dates and amount
    const durationMonths = parseInt(duration);
    const totalAmount = plan.pricePerMonth * durationMonths;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Create subscription
    const subscription = new CompanySubscription({
      company: companyId,
      plan: plan._id,
      planName: plan.name,
      pricePerMonth: plan.pricePerMonth,
      durationMonths,
      totalAmount,
      startDate,
      endDate,
      paymentStatus: 'pending',
      isActive: false
    });

    await subscription.save();

    // Redirect to payment page
    res.redirect(`/company/subscription/payment/${subscription._id}`);
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    req.flash('error', 'Failed to create subscription');
    res.redirect('/company/subscription-plans');
  }
};

// Get company subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const companyId = req.session.user.id;

    const subscriptions = await CompanySubscription.find({ company: companyId })
      .populate('plan')
      .sort({ createdAt: -1 });

    // Get current active subscription
    const company = await Company.findById(companyId);
    const hasActiveSubscription = company.hasActiveSubscription;

    res.render('company/subscriptions', {
      title: 'My Subscriptions',
      subscriptions,
      hasActiveSubscription,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load subscriptions'
    });
  }
};

// Get payment page for subscription
exports.getPaymentPage = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const subscriptionId = req.params.id;

    const subscription = await CompanySubscription.findOne({
      _id: subscriptionId,
      company: companyId
    }).populate('plan');

    if (!subscription) {
      return res.status(404).render('404', { title: 'Subscription Not Found' });
    }

    // If already paid, redirect to subscriptions
    if (subscription.paymentStatus === 'completed') {
      return res.redirect('/company/subscriptions');
    }

    const company = await Company.findById(companyId);

    res.render('company/payment', {
      title: 'Payment',
      subscription,
      company,
      error: null
    });
  } catch (error) {
    console.error('Payment page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load payment page'
    });
  }
};

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const companyId = req.session.user.id;
    const { subscriptionId, amount, currency } = req.body;

    // Validate inputs
    if (!subscriptionId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find subscription
    const subscription = await CompanySubscription.findOne({
      _id: subscriptionId,
      company: companyId
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: parseInt(amount),
      currency: currency,
      receipt: `subscription_${subscriptionId}`,
      payment_capture: 1,
      notes: {
        subscriptionId: subscriptionId,
        companyId: companyId
      }
    };

    console.log('Creating Razorpay order with options:', orderOptions);
    const order = await createOrder(orderOptions);
    console.log('Razorpay order created:', order);

    // Update subscription with order ID
    subscription.orderId = order.id;
    await subscription.save();

    res.json({ orderId: order.id });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Handle payment success
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { subscriptionId, paymentId, orderId, signature } = req.query;

    // Validate inputs
    if (!subscriptionId || !paymentId || !orderId || !signature) {
      req.flash('error', 'Invalid payment data');
      return res.redirect('/company/subscriptions');
    }

    const companyId = req.session.user.id;

    // Find subscription
    const subscription = await CompanySubscription.findOne({
      _id: subscriptionId,
      company: companyId,
      orderId: orderId
    });

    if (!subscription) {
      req.flash('error', 'Subscription not found');
      return res.redirect('/company/subscriptions');
    }

    // Verify payment signature
    console.log('Verifying payment signature:', { orderId, paymentId, signature });
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValidSignature) {
      console.error('Invalid payment signature');
      req.flash('error', 'Invalid payment signature');
      return res.redirect('/company/subscriptions');
    }

    console.log('Payment signature verified successfully');
    console.log('Payment received:', { subscriptionId, paymentId, orderId, signature });

    // Update subscription with payment details
    subscription.paymentId = paymentId;
    subscription.paymentSignature = signature;
    subscription.paymentStatus = 'completed';
    subscription.isActive = true;

    await subscription.save();

    // Update company subscription status
    const company = await Company.findById(companyId);
    company.hasActiveSubscription = true;
    company.currentSubscription = subscription._id;
    await company.save();

    req.flash('success', 'Payment successful! Your subscription is now active.');
    res.redirect('/company/dashboard');
  } catch (error) {
    console.error('Payment success handler error:', error);
    req.flash('error', 'Failed to process payment');
    res.redirect('/company/subscriptions');
  }
};
