const Room = require('../models/Room');
const Company = require('../models/Company');
const { CompanySubscription } = require('../models/Subscription');

// Homepage - Show limited featured rooms as a demo
exports.getHomepage = async (req, res) => {
  try {
    // Get companies with active subscriptions
    const companiesWithActiveSubscriptions = await Company.find({ hasActiveSubscription: true });
    const companyIds = companiesWithActiveSubscriptions.map(company => company._id);

    // Get rooms from admin (no company) or from companies with active subscriptions
    // Limit to 6 featured rooms for the homepage
    const featuredRooms = await Room.find({
      $or: [
        { company: null }, // Admin rooms
        { company: { $in: companyIds } } // Company rooms with active subscriptions
      ]
    })
    .populate('company', 'name')
    .sort({ createdAt: -1 })
    .limit(6); // Show only 6 rooms on homepage

    // Get total count of available rooms
    const totalRoomCount = await Room.countDocuments({
      $or: [
        { company: null },
        { company: { $in: companyIds } }
      ]
    });

    // Get distinct categories for the category showcase
    const categories = await Room.distinct('category');

    res.render('home', {
      title: 'Real Estate CMS - Premium Properties',
      featuredRooms,
      totalRoomCount,
      categories
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load properties'
    });
  }
};

// Properties page with filtering
exports.getProperties = async (req, res) => {
  try {
    // Get filter parameters from query string
    const { category, minPrice, maxPrice, location, forRent } = req.query;

    // Get companies with active subscriptions
    const companiesWithActiveSubscriptions = await Company.find({ hasActiveSubscription: true });
    const companyIds = companiesWithActiveSubscriptions.map(company => company._id);

    // Build the filter query
    const filter = {
      $or: [
        { company: null }, // Admin rooms
        { company: { $in: companyIds } } // Company rooms with active subscriptions
      ]
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Add location filter if provided
    if (location) {
      filter.location = { $regex: location, $options: 'i' }; // Case-insensitive search
    }

    // Add rental status filter if provided
    if (forRent === 'true') {
      filter.rentalStatus = 'for-rent';
    } else if (forRent === 'false') {
      filter.rentalStatus = 'not-for-rent';
    }

    // Get all categories for the filter dropdown
    const categories = await Room.distinct('category');

    // Get rooms based on filters
    const rooms = await Room.find(filter)
      .populate('company', 'name')
      .sort({ createdAt: -1 });

    res.render('properties', {
      title: 'Properties',
      rooms,
      categories,
      filters: {
        category: category || 'all',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        location: location || '',
        forRent: forRent || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load properties'
    });
  }
};

// Room details page
exports.getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('company');

    if (!room) {
      return res.status(404).render('404', { title: 'Property Not Found' });
    }

    // If room belongs to a company, check if company has active subscription
    if (room.company) {
      const company = await Company.findById(room.company._id);

      if (!company || !company.hasActiveSubscription) {
        return res.status(404).render('404', {
          title: 'Property Not Available',
          message: 'This property is currently not available for viewing.'
        });
      }
    }

    res.render('room-details', {
      title: room.title,
      room
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load property details'
    });
  }
};
