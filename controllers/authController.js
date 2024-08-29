const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ExpressError = require('../utils/ExpressError');
const Joi = require('joi');
const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required(),
  address: Joi.string().min(5).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const register = asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    req.flash('error', error.details[0].message);
    return res.redirect('/register');
  }

  const { name, email, password, phone, address } = req.body;

  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ExpressError(
        'Email already in use. Please use a different email.',
        400,
      );
    }

    existingUser = await User.findOne({ phone });
    if (existingUser) {
      throw new ExpressError(
        'Phone number already in use. Please use a different phone number.',
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });
    await user.save();

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/');
  } catch (err) {
    console.error('Error during registration:', err);
    req.flash('error', err.message || 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

const login = asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    req.flash('error', error.details[0].message);
    return res.redirect('/');
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ExpressError(
        'Invalid email or password. Please try again.',
        400,
      );
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.cookie('token', token);

    req.flash('success', 'Login successful!');
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/user/dashboard');
    }
  } catch (err) {
    console.error('Error during login:', err);
    req.flash('error', err.message || 'Login failed. Please try again.');
    res.redirect('/');
  }
});

const logout = (req, res) => {
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully.');
  res.redirect('/');
};

module.exports = { register, login, logout };
