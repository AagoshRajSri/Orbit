import jwt from "jsonwebtoken";

export const protectAdminRoute = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    
    // Check Bearer token or cookies
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.admin_jwt) {
      token = req.cookies.admin_jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No Admin Token Provided",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is missing");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure token is an admin token
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Not an Admin",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("[AdminMiddleware] Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Admin token has expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid admin token" });
  }
};
