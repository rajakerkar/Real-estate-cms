const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const subscriptionController = require('../controllers/subscriptionController');
const { isAuthenticated, isAdmin, redirectIfAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Root admin route - redirect to dashboard if authenticated, otherwise to login
router.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Login routes
router.get('/login', redirectIfAuthenticated, adminController.getLoginPage);
router.post('/login', redirectIfAuthenticated, adminController.login);
router.get('/logout', adminController.logout);

// Dashboard
router.get('/dashboard', isAdmin, adminController.getDashboard);

// Room management routes
router.get('/rooms/add', isAdmin, adminController.getAddRoomForm);
router.post('/rooms/add', isAdmin, upload.array('images', 10), adminController.addRoom);
router.get('/rooms/edit/:id', isAdmin, adminController.getEditRoomForm);
// Support both PUT and POST for updating rooms
router.put('/rooms/edit/:id', isAdmin, upload.array('images', 10), adminController.updateRoom);
router.post('/rooms/edit/:id', isAdmin, upload.array('images', 10), adminController.updateRoom);
router.delete('/rooms/:id', isAdmin, adminController.deleteRoom);
router.post('/rooms/:id/toggle-status', isAdmin, adminController.toggleRoomStatus);
router.delete('/rooms/:roomId/images/:imageIndex', isAdmin, adminController.deleteImage);

// Company management routes
router.get('/companies', isAdmin, adminController.getAllCompanies);
router.get('/companies/:id', isAdmin, adminController.getCompanyDetails);
router.post('/companies/:id/toggle-status', isAdmin, adminController.toggleCompanyStatus);

// Subscription management routes
router.get('/subscription-plans', isAdmin, subscriptionController.getSubscriptionPlans);
router.get('/subscription-plans/add', isAdmin, subscriptionController.getAddPlanForm);
router.post('/subscription-plans/add', isAdmin, subscriptionController.addPlan);
router.get('/subscription-plans/edit/:id', isAdmin, subscriptionController.getEditPlanForm);
router.post('/subscription-plans/edit/:id', isAdmin, subscriptionController.updatePlan);
router.delete('/subscription-plans/:id', isAdmin, subscriptionController.deletePlan);
router.get('/subscriptions', isAdmin, subscriptionController.getAllSubscriptions);
router.get('/subscriptions/:id', isAdmin, subscriptionController.getSubscriptionDetails);
router.post('/subscriptions/:id/status', isAdmin, subscriptionController.updateSubscriptionStatus);

module.exports = router;
