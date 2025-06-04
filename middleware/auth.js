// Authentication middleware for both admin and company users
const isAuthenticated = (req, res, next) => {
  // Check if user is logged in
  if (req.session.user) {
    return next();
  }

  // Store the original URL they were trying to access
  req.session.returnTo = req.originalUrl;

  // Redirect to appropriate login page based on URL
  if (req.originalUrl.startsWith('/admin')) {
    res.redirect('/admin/login');
  } else if (req.originalUrl.startsWith('/company')) {
    res.redirect('/company/login');
  } else {
    res.redirect('/login');
  }
};

// Admin authentication middleware
const isAdmin = (req, res, next) => {
  // Check if user is logged in with admin credentials
  if (req.session.user && req.session.user.username === 'admin') {
    return next();
  }

  // Store the original URL they were trying to access
  req.session.returnTo = req.originalUrl;

  // Redirect to admin login page
  res.redirect('/admin/login');
};

// Company authentication middleware
const isCompany = (req, res, next) => {
  // Check if user is logged in as a company
  if (req.session.user && req.session.user.role === 'company') {
    return next();
  }

  // Store the original URL they were trying to access
  req.session.returnTo = req.originalUrl;

  // Redirect to company login page
  res.redirect('/company/login');
};

// Redirect if already logged in
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    // Redirect based on user role
    if (req.session.user.username === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'company') {
      return res.redirect('/company/dashboard');
    }
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isCompany,
  redirectIfAuthenticated
};
