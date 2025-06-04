const Company = require('../models/Company');
const { CompanySubscription } = require('../models/Subscription');

// Check if company has an active subscription
const hasActiveSubscription = async (req, res, next) => {
  try {
    // Skip check for admin users
    if (req.session.user && req.session.user.username === 'admin') {
      return next();
    }
    
    // Check if user is logged in as a company
    if (!req.session.user || req.session.user.role !== 'company') {
      return res.redirect('/company/login');
    }
    
    const companyId = req.session.user.id;
    
    // Get company with current subscription
    const company = await Company.findById(companyId).populate('currentSubscription');
    
    if (!company) {
      return res.redirect('/company/login');
    }
    
    // If company has no active subscription flag, check if there's an active subscription
    if (!company.hasActiveSubscription) {
      // Find active subscription
      const activeSubscription = await CompanySubscription.findOne({
        company: companyId,
        isActive: true,
        paymentStatus: 'completed',
        endDate: { $gte: new Date() }
      });
      
      if (activeSubscription) {
        // Update company with active subscription
        company.hasActiveSubscription = true;
        company.currentSubscription = activeSubscription._id;
        await company.save();
        
        // Continue to next middleware
        return next();
      }
      
      // No active subscription, redirect to subscription plans
      req.flash('error', 'You need an active subscription to access this feature');
      return res.redirect('/company/subscription-plans');
    }
    
    // Check if current subscription is still valid
    if (company.currentSubscription) {
      const subscription = company.currentSubscription;
      
      // If it's a populated document
      if (typeof subscription.isActiveAndValid === 'function') {
        if (subscription.isActiveAndValid()) {
          return next();
        }
      } else {
        // Fetch the subscription if it's just an ID
        const subscriptionDoc = await CompanySubscription.findById(subscription);
        if (subscriptionDoc && subscriptionDoc.isActiveAndValid()) {
          return next();
        }
      }
      
      // Subscription expired, update company
      company.hasActiveSubscription = false;
      company.currentSubscription = null;
      await company.save();
    }
    
    // No valid subscription, redirect to subscription plans
    req.flash('error', 'Your subscription has expired. Please renew to continue.');
    return res.redirect('/company/subscription-plans');
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while checking subscription status'
    });
  }
};

module.exports = {
  hasActiveSubscription
};
