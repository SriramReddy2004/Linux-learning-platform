const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const bcryptjs = require('bcryptjs');
const axios = require('axios');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // Add user to openwebui
    try {
      await axios.post(`http://host.docker.internal:5000/api/v1/auths/add`, {
        name: username,
        email,
        password,
        role: 'user',
        profile_image_url: "data:image/jpeg;base64,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"
      }, {
        headers: {
          Authorization: `Bearer ${process.env.OPENWEBUI_ADMIN_API_KEY}`
        }
      });
    } catch (error) {
      logger.error(`Error occurred while adding user to OpenWebUI: ${JSON.stringify(error)}`);
    }


    logger.info(`New user registered: ${user.username}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.username}`);
    let openWebUIToken = null;
    // login openwebui
    try {
      const data = await axios.post(`http://host.docker.internal:5000/api/v1/auths/signin`, {
        email,
        password
      });
      logger.info(`OpenWebUI token: ${data.data.token}`);
      openWebUIToken = data.data.token;
    } catch (error) {
      logger.error(`Error occurred while logging into OpenWebUI: ${JSON.stringify(error)}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res
    .cookie("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: process.env.JWT_EXPIRE// 7 days
    })
    .cookie("token", openWebUIToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: process.env.JWT_EXPIRE// 7 days
    })
    .status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token,
        openWebUIToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('auth-token');
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
