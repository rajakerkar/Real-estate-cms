const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { isAuthenticated, isCompany, redirectIfAuthenticated } = require('../middleware/auth');
const { hasActiveSubscription } = require('../middleware/subscription');
const upload = require('../middleware/upload');

// Registration and login routes
router.get('/register', redirectIfAuthenticated, companyController.getRegisterPage);
router.post('/register', redirectIfAuthenticated, upload.single('logo'), companyController.register);
router.get('/login', redirectIfAuthenticated, companyController.getLoginPage);
router.post('/login', redirectIfAuthenticated, companyController.login);
router.get('/logout', companyController.logout);

// Dashboard
router.get('/dashboard', isCompany, companyController.getDashboard);

// Profile management
router.get('/profile', isCompany, companyController.getProfile);
router.post('/profile', isCompany, upload.single('logo'), companyController.updateProfile);
router.get('/change-password', isCompany, companyController.getChangePasswordPage);
router.post('/change-password', isCompany, companyController.changePassword);

// Room management (requires active subscription)
router.get('/rooms/add', isCompany, hasActiveSubscription, companyController.getAddRoomForm);
router.post('/rooms/add', isCompany, hasActiveSubscription, upload.array('images', 10), companyController.addRoom);
router.get('/rooms/edit/:id', isCompany, hasActiveSubscription, companyController.getEditRoomForm);
router.post('/rooms/edit/:id', isCompany, hasActiveSubscription, upload.array('images', 10), companyController.updateRoom);
router.delete('/rooms/:id', isCompany, hasActiveSubscription, companyController.deleteRoom);
router.delete('/rooms/:roomId/images/:imageIndex', isCompany, hasActiveSubscription, companyController.deleteImage);

// Subscription management
router.get('/subscription-plans', isCompany, companyController.getSubscriptionPlans);
router.post('/subscription-plans/subscribe', isCompany, companyController.subscribeToPlan);
router.get('/subscriptions', isCompany, companyController.getSubscriptions);
router.get('/subscription/payment/:id', isCompany, companyController.getPaymentPage);

// Razorpay integration
router.post('/subscription/create-order', isCompany, companyController.createOrder);
router.get('/subscription/payment-success', isCompany, companyController.handlePaymentSuccess);

module.exports = router;
