const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Normalize user object to always have userId
  req.user = { ...decoded, userId: decoded.userId || decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const creatorMiddleware = (req, res, next) => {
  if (!['creator', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Creator access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  creatorMiddleware
};
