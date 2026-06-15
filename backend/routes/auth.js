const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user with email and password
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Server error during login' });
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ success: true, user: userObj });
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login using email and password
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(400).json({ error: info.message || 'Invalid credentials' });
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Server error during login' });
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ success: true, user: userObj });
    });
  })(req, res, next);
});

// @route   GET /api/auth/google
// @desc    Authenticate with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=true` }),
  (req, res) => {
    // Successful authentication, redirect to frontend with a success indicator
    // The session cookie is already set by passport.authenticate()
    const redirectUrl = new URL(`${process.env.CLIENT_URL}/auth-callback`);
    redirectUrl.searchParams.append('status', 'success');
    res.redirect(redirectUrl.toString());
  }
);

// @route   GET /api/auth/me
// @desc    Get current session user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const userObj = req.user.toObject();
    delete userObj.password;
    res.json({ user: userObj, status: 'authenticated' });
  } else {
    res.json({ user: null, status: 'unauthenticated' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
