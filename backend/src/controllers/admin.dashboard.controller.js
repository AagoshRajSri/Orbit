import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Nexus from "../models/nexus.model.js";
import { getOnlineUsersCount } from "../socket/socket.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalNexuses = await Nexus.countDocuments();

    // Get today's stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: startOfToday } });

    const onlineUsers = await getOnlineUsersCount();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMessages,
        totalNexuses,
        newUsersToday,
        messagesToday,
        onlineUsers
      }
    });
  } catch (error) {
    console.error("[AdminDashboard] Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Server error fetching stats" });
  }
};
