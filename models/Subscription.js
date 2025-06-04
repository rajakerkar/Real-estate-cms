const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  pricePerMonth: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  features: [{
    type: String,
    trim: true
  }],
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
  }
});

// Update the updatedAt field on save
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const companySubscriptionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  pricePerMonth: {
    type: Number,
    required: true,
    min: 0
  },
  durationMonths: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderId: {
    type: String,
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  paymentSignature: {
    type: String,
    default: null
  },
  paymentDetails: {
    type: Object,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: false
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
companySubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if subscription is active and not expired
companySubscriptionSchema.methods.isActiveAndValid = function() {
  const now = new Date();
  return this.isActive &&
         this.paymentStatus === 'completed' &&
         this.endDate >= now;
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const CompanySubscription = mongoose.model('CompanySubscription', companySubscriptionSchema);

module.exports = {
  SubscriptionPlan,
  CompanySubscription
};
