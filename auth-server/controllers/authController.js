const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, location, password } = req.body;

    // 1. Mandatory Field Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Location selection is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();

    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    // 2. Prevent Duplicate Email Accounts
    const existingEmailUser = await User.findOne({ email: cleanEmail });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
      });
    }

    // 3. Prevent Duplicate Phone Accounts
    const existingPhoneUser = await User.findOne({ phone: cleanPhone });
    if (existingPhoneUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists. Please login instead.',
      });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Save User in MongoDB
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      location: location.trim(),
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to JalRakshak.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * @desc    Authenticate user & get token (Login with Email OR Mobile Number)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !loginIdentifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your registered Email or Mobile Number.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password.',
      });
    }

    const rawIdentifier = loginIdentifier.trim();
    const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '');

    // Search user by email OR mobile phone
    const user = await User.findOne({
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { phone: cleanPhone.length >= 10 ? cleanPhone : rawIdentifier },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. No account found with that email or mobile number.',
      });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

/**
 * @desc    Get authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.location,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user session.',
    });
  }
};

/**
 * @desc    Logout user / invalidate session
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
