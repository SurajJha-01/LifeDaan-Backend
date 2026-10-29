
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Request se token nikaalna
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. Please login.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Logged-in user ki details request mein rakhna
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

module.exports = authMiddleware;
