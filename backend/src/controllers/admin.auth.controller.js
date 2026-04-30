import jwt from "jsonwebtoken";

// Hardcoded admin credentials
const ADMIN_USERNAME = "aagosh0000@gmail.com";
const ADMIN_PASSWORD = "Aagosh_0000";

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Issue Admin JWT
    const token = jwt.sign(
      { role: "admin", username },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "12h" }
    );

    res.cookie("admin_jwt", token, {
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Admin authenticated successfully",
      token,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin credentials",
  });
};

export const adminLogout = async (req, res) => {
  res.cookie("admin_jwt", "", { maxAge: 0 });
  return res.status(200).json({ success: true, message: "Admin logged out" });
};

export const checkAdminAuth = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin is authenticated",
    admin: req.admin, // from middleware
  });
};
