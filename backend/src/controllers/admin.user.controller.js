import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { logAdminAction } from "../lib/adminLogger.js";
import { getIO } from "../socket/socket.js";

// Get all users with pagination and search
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AdminUser] Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error fetching users" });
  }
};

// Force logout a user (invalidate all their sessions)
export const forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Set isValid = false for all sessions belonging to this user
    await Session.updateMany({ userId }, { $set: { isValid: false } });

    // Force disconnect all active sockets for this user
    try {
      const io = getIO();
      io.in(userId).disconnectSockets(true);
    } catch (err) {
      console.warn(`[AdminUser] Failed to disconnect sockets for ${userId}:`, err.message);
    }

    await logAdminAction(req, "FORCE_LOGOUT", "User", userId);

    return res.status(200).json({ success: true, message: "All user sessions invalidated and sockets disconnected." });
  } catch (error) {
    console.error("[AdminUser] Error forcing logout:", error);
    res.status(500).json({ success: false, message: "Server error forcing logout" });
  }
};

// Ban / Unban user (Toggle account lock)
export const toggleBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Toggle ban status (Assuming we add an 'isBanned' field to User model, or use 'isLocked')
    user.isLocked = !user.isLocked; // Re-using isLocked, or could add a specific isBanned field
    
    if (user.isLocked) {
      // Force logout if banned
      await Session.updateMany({ userId }, { $set: { isValid: false } });
    }

    await user.save();

    await logAdminAction(req, user.isLocked ? "BAN_USER" : "UNBAN_USER", "User", userId);

    return res.status(200).json({
      success: true,
      message: `User successfully ${user.isLocked ? "banned" : "unbanned"}`,
      user: { _id: user._id, isLocked: user.isLocked }
    });
  } catch (error) {
    console.error("[AdminUser] Error toggling ban:", error);
    res.status(500).json({ success: false, message: "Server error toggling ban" });
  }
};

// Soft Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Soft delete user
    user.isDeleted = true;
    await user.save();
    
    // Invalidate sessions
    await Session.updateMany({ userId }, { $set: { isValid: false } });

    await logAdminAction(req, "SOFT_DELETE_USER", "User", userId);

    return res.status(200).json({ success: true, message: "User successfully soft-deleted" });
  } catch (error) {
    console.error("[AdminUser] Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error deleting user" });
  }
};

// Restore Soft-Deleted User
export const restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isDeleted = false;
    await user.save();

    await logAdminAction(req, "RESTORE_USER", "User", userId);

    return res.status(200).json({ success: true, message: "User successfully restored", user });
  } catch (error) {
    console.error("[AdminUser] Error restoring user:", error);
    res.status(500).json({ success: false, message: "Server error restoring user" });
  }
};
