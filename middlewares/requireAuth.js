const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.linkflow_token;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required. Please login.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired authentication session.",
    });
  }
}

module.exports = requireAuth;
