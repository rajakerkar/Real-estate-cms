const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  gstin: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    designation: {
      type: String
    },
    phone: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  hasActiveSubscription: {
    type: Boolean,
    default: false
  },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanySubscription',
    default: null
  }
});

// Hash password before saving
companySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field on save
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare passwords
companySchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
