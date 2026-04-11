const User = require('../models/userModel')

// Reads x-user-id header, queries the DB, and attaches the user to req.user
const authenticate = (req, res, next) => {
  const userId = req.headers['x-user-id']

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  User.getById(userId, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' })
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ message: 'Invalid user' })
    }

    const user = results[0]
    req.user = { id: user.user_id, email: user.email, role: user.role }
    next()
  })
}

// Must be used after authenticate — rejects non-admin users
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  const adminRoles = new Set(['admin', 'administrator'])
  if (!adminRoles.has(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

module.exports = { authenticate, requireAdmin }
