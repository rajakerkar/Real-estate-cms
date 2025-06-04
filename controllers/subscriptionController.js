const { SubscriptionPlan, CompanySubscription } = require('../models/Subscription');
const Room = require('../models/Room');
const Company = require('../models/Company');

// Get all subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const subscriptionPlans = await SubscriptionPlan.find().sort({ category: 1 });

    res.render('admin/subscription-plans', {
      title: 'Subscription Plans',
      subscriptionPlans,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Subscription plans error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load subscription plans'
    });
  }
};

// Add subscription plan form
exports.getAddPlanForm = (req, res) => {
  res.render('admin/add-subscription-plan', {
    title: 'Add Subscription Plan',
    error: null,
    formData: {}
  });
};

// Process add subscription plan
exports.addPlan = async (req, res) => {
  try {
    const { name, pricePerMonth, description, features } = req.body;

    // Check if plan with this name already exists
    const existingPlan = await SubscriptionPlan.findOne({ name });

    if (existingPlan) {
      return res.render('admin/add-subscription-plan', {
        title: 'Add Subscription Plan',
        error: `A plan named "${name}" already exists`,
        formData: req.body
      });
    }

    // Process features if provided
    let featuresList = [];
    if (features) {
      // Split features by new line and filter out empty lines
      featuresList = features.split('\n')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);
    }

    // Create new plan
    const newPlan = new SubscriptionPlan({
      name,
      pricePerMonth,
      description: description || '',
      features: featuresList,
      isActive: true
    });

    await newPlan.save();

    req.flash('success', 'Subscription plan added successfully');
    res.redirect('/admin/subscription-plans');
  } catch (error) {
    console.error('Add subscription plan error:', error);
    res.render('admin/add-subscription-plan', {
      title: 'Add Subscription Plan',
      error: 'Failed to add subscription plan',
      formData: req.body
    });
  }
};

// Edit subscription plan form
exports.getEditPlanForm = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      req.flash('error', 'Subscription plan not found');
      return res.redirect('/admin/subscription-plans');
    }

    res.render('admin/edit-subscription-plan', {
      title: 'Edit Subscription Plan',
      plan,
      error: null
    });
  } catch (error) {
    console.error('Edit subscription plan form error:', error);
    req.flash('error', 'Failed to load subscription plan');
    res.redirect('/admin/subscription-plans');
  }
};

// Process edit subscription plan
exports.updatePlan = async (req, res) => {
  try {
    const { pricePerMonth, description, features, isActive } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      req.flash('error', 'Subscription plan not found');
      return res.redirect('/admin/subscription-plans');
    }

    // Process features if provided
    let featuresList = [];
    if (features) {
      // Split features by new line and filter out empty lines
      featuresList = features.split('\n')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);
    }

    // Update plan
    plan.pricePerMonth = pricePerMonth;
    plan.description = description || '';
    plan.features = featuresList;
    plan.isActive = isActive === 'true';

    await plan.save();

    req.flash('success', 'Subscription plan updated successfully');
    res.redirect('/admin/subscription-plans');
  } catch (error) {
    console.error('Update subscription plan error:', error);

    try {
      const plan = await SubscriptionPlan.findById(req.params.id);

      if (plan) {
        return res.render('admin/edit-subscription-plan', {
          title: 'Edit Subscription Plan',
          plan,
          error: 'Failed to update subscription plan'
        });
      }
    } catch (secondaryError) {
      console.error('Secondary error:', secondaryError);
    }

    req.flash('error', 'Failed to update subscription plan');
    res.redirect('/admin/subscription-plans');
  }
};

// Delete subscription plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      req.flash('error', 'Subscription plan not found');
      return res.redirect('/admin/subscription-plans');
    }

    // Check if plan is in use
    const activeSubscriptions = await CompanySubscription.countDocuments({
      plan: plan._id,
      isActive: true,
      endDate: { $gte: new Date() }
    });

    if (activeSubscriptions > 0) {
      req.flash('error', `Cannot delete plan. It has ${activeSubscriptions} active subscriptions.`);
      return res.redirect('/admin/subscription-plans');
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);

    req.flash('success', 'Subscription plan deleted successfully');
    res.redirect('/admin/subscription-plans');
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    req.flash('error', 'Failed to delete subscription plan');
    res.redirect('/admin/subscription-plans');
  }
};

// Get all company subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await CompanySubscription.find()
      .populate('company', 'name email')
      .populate('plan', 'name')
      .sort({ createdAt: -1 });

    res.render('admin/subscriptions', {
      title: 'All Subscriptions',
      subscriptions
    });
  } catch (error) {
    console.error('All subscriptions error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load subscriptions'
    });
  }
};

// Get subscription details
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const subscription = await CompanySubscription.findById(req.params.id)
      .populate('company')
      .populate('plan');

    if (!subscription) {
      return res.status(404).render('404', { title: 'Subscription Not Found' });
    }

    res.render('admin/subscription-details', {
      title: 'Subscription Details',
      subscription
    });
  } catch (error) {
    console.error('Subscription details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load subscription details'
    });
  }
};

// Update subscription status
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const subscription = await CompanySubscription.findById(req.params.id);

    if (!subscription) {
      req.flash('error', 'Subscription not found');
      return res.redirect('/admin/subscriptions');
    }

    // Update subscription status
    subscription.isActive = status === 'active';

    if (status === 'active') {
      subscription.paymentStatus = 'completed';
    } else if (status === 'inactive') {
      subscription.paymentStatus = 'failed';
    }

    await subscription.save();

    // Update company subscription status
    const company = await Company.findById(subscription.company);
    if (company) {
      if (status === 'active') {
        company.hasActiveSubscription = true;
        company.currentSubscription = subscription._id;
      } else {
        // Only update if this is the current subscription
        if (company.currentSubscription &&
            company.currentSubscription.toString() === subscription._id.toString()) {
          company.hasActiveSubscription = false;
          company.currentSubscription = null;
        }
      }
      await company.save();
    }

    req.flash('success', 'Subscription status updated successfully');
    res.redirect(`/admin/subscriptions/${req.params.id}`);
  } catch (error) {
    console.error('Update subscription status error:', error);
    req.flash('error', 'Failed to update subscription status');
    res.redirect(`/admin/subscriptions/${req.params.id}`);
  }
};
