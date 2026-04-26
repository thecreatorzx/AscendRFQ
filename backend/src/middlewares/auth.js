import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("token");
    return res
      .status(401)
      .json({ success: false, message: "Session expired or invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You do not have the required permissions.",
      });
    }
    next();
  };
};

export { authenticate, authorize };
