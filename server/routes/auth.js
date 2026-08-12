import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerRules, loginRules } from '../middleware/authValidators.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import logger from '../utils/logger.js';
import { config } from '../config/serverConfig.js';

const router = express.Router();
const CTX = 'auth';

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
// Policy:
//   - 'employee' role: anyone can self-register.
//   - 'admin' role: allowed ONLY when no admin account exists yet (first-time
//     setup) OR when an authenticated admin is making the request.
//   - This prevents unlimited admin self-registration in production.
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { fullName, email, password, role = 'employee' } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    // Admin registration guard
    if (role === 'admin') {
      const adminExists = await User.exists({ role: 'admin' });

      if (adminExists) {
        // An admin already exists — caller must themselves be an authenticated admin
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return res.status(403).json({
            success: false,
            message: 'Creating additional admin accounts requires an existing admin to be logged in.',
          });
        }
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
          const caller  = await User.findById(decoded.id);
          if (!caller || caller.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Only an existing admin can create new admin accounts.',
            });
          }
        } catch {
          return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
      }
      // else: no admin exists yet — allow first-time admin setup
    }

    const user  = await User.create({ fullName, email, password, role });
    const token = signToken(user._id);

    logger.info(CTX, 'User registered', { id: user._id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    logger.info(CTX, 'User logged in', { id: user._id, role: user.role });

    res.json({ success: true, message: 'Logged in successfully.', token, user });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

export { router as authRouter };
