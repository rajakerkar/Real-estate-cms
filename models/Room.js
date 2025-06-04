const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Villa', 'Kothi', 'Farmhouse', 'Apartment', 'Studio', 'Single Room', 'Penthouse', 'Duplex'],
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold'],
    default: 'available'
  },
  rentalStatus: {
    type: String,
    enum: ['for-rent', 'not-for-rent'],
    default: 'not-for-rent'
  },
  images: [{
    path: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    cloudinary_id: {
      type: String,
      default: null
    }
  }],
  monthlyRent: {
    type: Number,
    default: 0
  },
  agentDetails: {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    }
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

// Update the updatedAt field on save
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
