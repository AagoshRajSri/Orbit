import AdminLog from "../models/adminLog.model.js";

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminLog.countDocuments();

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AdminSecurity] Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Server error fetching logs" });
  }
};
