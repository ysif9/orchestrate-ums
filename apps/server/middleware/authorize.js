/**
 * Authorization Middleware
 * Checks if authenticated user has required role(s)
 * Must be used after authenticate middleware
 * 
 * Usage:
 * router.post('/admin-only', authenticate, authorize('admin'), (req, res) => {
 *   // Only admins can access this route
 * });
 * 
 * router.get('/staff-or-admin', authenticate, authorize('admin', 'staff'), (req, res) => {
 *   // Admins or staff can access this route
 * });
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated (should be set by authenticate middleware)
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

module.exports = authorize;

