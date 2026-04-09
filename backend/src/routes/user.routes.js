/**
 * User Routes
 * Handles user-related endpoints
 */      

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const User = require('../models/User');

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, addresses },
      { new: true }
    );
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    res.json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});      

// Add address
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
