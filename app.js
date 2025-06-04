const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-cms')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'real-estate-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Pass user info to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Flash messages middleware
app.use((req, res, next) => {
  if (!req.session.flash) {
    req.session.flash = {};
  }
  req.flash = function(type, message) {
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }
    req.session.flash[type].push(message);
  };
  res.locals.flash = req.session.flash;
  req.session.flash = {};
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const companyRoutes = require('./routes/company');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/company', companyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
