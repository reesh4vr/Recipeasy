
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  isDatabaseReady,
  databaseUnavailableResponse,
} = require('../utils/dbStatus');

/**
 * Generate JWT token for user
 * @param {ObjectId} userId 
 * @returns {string} 
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' } 
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const { email, password, default_protein_goal, default_max_time } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }


    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please enter a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User exists',
        message: 'An account with this email already exists'
      });
    }

    const user = new User({
      email: email.toLowerCase(),
      password_hash: password, 
      default_protein_goal: default_protein_goal || 0,
      default_max_time: default_max_time || 60
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'User exists',
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * @desc    Login user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const user = req.user;
    
    res.json({
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred fetching user data'
    });
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
const updatePreferences = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const { default_protein_goal, default_max_time } = req.body;
    const user = req.user;

    if (typeof default_protein_goal === 'number') {
      user.default_protein_goal = Math.max(0, Math.min(200, default_protein_goal));
    }
    
    if (typeof default_max_time === 'number') {
      user.default_max_time = Math.max(5, Math.min(300, default_max_time));
    }

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred updating preferences'
    });
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser,
  updatePreferences
};

