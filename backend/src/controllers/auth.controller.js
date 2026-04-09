/**
 * Auth Controller
 * Handles user authentication and authorization
 */

const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/token.service');
const logger = require('../utils/logger');
const googleAuthService = require('../services/googleAuth.service');

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const { name, email, password, phone, role, referralCode: signupReferralCode } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Handle Referral (Mar 28 - Ultra Feature)
      let referrer = null;
      if (signupReferralCode) {
        referrer = await User.findOne({ referralCode: signupReferralCode.toUpperCase() });
        if (referrer) {
           referrer.leafPoints = (referrer.leafPoints || 0) + 500; // 500 points for referral
           await referrer.save();
        }
      }

      // Generate unique referral code for new user
      const uniqueCode = `GREEN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: role || 'customer',
        referralCode: uniqueCode,
        referredBy: referrer ? referrer._id : null,
        leafPoints: referrer ? 200 : 0, // 200 welcome bonus if referred
        isVerified: true 
      });

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      logger.info(`New user registered: ${user.email}`, {
        requestId: req.requestId || null,
        userId: user._id.toString(),
        endpoint: 'POST /api/auth/register'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicProfile(),
          token: accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`, {
        requestId: req.requestId || null,
        userId: user._id.toString(),
        endpoint: 'POST /api/auth/login'
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          accessToken: accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Save new refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired'
        });
      }
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      logger.info(`User logged out: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      
      res.json({
        success: true,
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone, profileImage, addresses } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { name, phone, profileImage, addresses },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id).select('+password');
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth manual POST login
  async googleLogin(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Google token is required' });
      }

      // Verify token
      const payload = await googleAuthService.verifyGoogleToken(token);
      if (!payload || !payload.email) {
        return res.status(401).json({ success: false, message: 'Invalid Google token' });
      }

      // Find or create user
      let user = await User.findOne({ email: payload.email });
      if (!user) {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          password: require('crypto').randomBytes(32).toString('hex'), // Auto-generate secure dummy password for OAuth schemas
          profileImage: payload.picture,
          role: 'customer',
          isVerified: true
        });
      } else if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      // Generate API tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in via Google: ${user.email}`);

      res.json({
        success: true,
        message: 'Google login successful',
        data: {
          user: user.getPublicProfile(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Google auth error:', error);
      next(error);
    }
  }

  // Purchase GreenPass Subscription (Mar 28 - Ultra Feature)
  async purchaseGreenPass(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // 30 days extension
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      user.isGreenPassMember = true;
      user.greenPassExpiry = expiry;
      await user.save();

      logger.info(`GreenPass purchased by user: ${user.email}`);

      res.json({
        success: true,
        message: 'GreenPass activated successfully! Enjoy free deliveries for 30 days.',
        data: {
          isGreenPassMember: user.isGreenPassMember,
          greenPassExpiry: user.greenPassExpiry
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

