/**
 * authorize(...roles)
 * Factory that returns middleware restricting access to users whose role
 * is in the provided list.  Must be used AFTER authenticate.
 *
 * Usage:
 *   router.delete('/:id', authenticate, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

export default authorize;
