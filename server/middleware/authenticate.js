import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/serverConfig.js';

/**
 * authenticate
 * Verifies the Bearer token in the Authorization header.
 * Attaches the full user document (without password) to req.user.
 * Returns 401 for missing/invalid tokens and 401 with a clear message for expired ones.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    // Fetch fresh user data — catches deactivated accounts between requests
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in.' });
  }
};

export default authenticate;
