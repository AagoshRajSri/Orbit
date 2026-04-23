import User from "../models/user.model.js";
import ConstellationProfile from "../models/constellationProfile.model.js";

/**
 * Check if a username is available for constellation signup
 * GET /auth/constellation/check-username?username=xxx
 */
export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 3
    ) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
        available: false,
      });
    }

    const trimmedUsername = username.trim();

    // Check if username exists in User collection
    const existingUser = await User.findOne({
      username: { $regex: `^${trimmedUsername}$`, $options: "i" }, // Case-insensitive
    });

    if (existingUser) {
      return res.status(200).json({
        message: "Username already taken",
        available: false,
        username: trimmedUsername,
      });
    }

    return res.status(200).json({
      message: "Username is available",
      available: true,
      username: trimmedUsername,
    });
  } catch (error) {
    console.error("Error in checkUsernameAvailability:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get the constellation icons that a user selected during signup
 * GET /auth/constellation/get-icons?username=xxx
 * Returns: { selectedIcons: ["Apple", "Orange", "Cat"] }
 */
export const getConstellationIcons = async (req, res) => {
  try {
    const { username } = req.query;

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 3
    ) {
      return res.status(400).json({
        message: "Valid username required",
        selectedIcons: [],
      });
    }

    const trimmedUsername = username.trim();

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: `^${trimmedUsername}$`, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        selectedIcons: [],
      });
    }

    // Get constellation profile with selectedIcons
    const profile = await ConstellationProfile.findOne({ userId: user._id });

    if (
      !profile ||
      !profile.selectedIcons ||
      profile.selectedIcons.length === 0
    ) {
      return res.status(200).json({
        message: "No constellation icons found for this user",
        selectedIcons: [],
        userId: user._id,
      });
    }

    return res.status(200).json({
      message: "Icons retrieved successfully",
      selectedIcons: profile.selectedIcons,
      userId: user._id,
    });
  } catch (error) {
    console.error("Error in getConstellationIcons:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
