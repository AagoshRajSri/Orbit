import Nexus from "../models/nexus.model.js";
import { logAdminAction } from "../lib/adminLogger.js";

export const getNexuses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const nexuses = await Nexus.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("members.user", "username email");

    const total = await Nexus.countDocuments();

    return res.status(200).json({
      success: true,
      nexuses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AdminNexus] Error fetching nexuses:", error);
    res.status(500).json({ success: false, message: "Server error fetching nexuses" });
  }
};

export const deleteNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;

    const nexus = await Nexus.findById(nexusId);
    if (!nexus) {
      return res.status(404).json({ success: false, message: "Nexus not found" });
    }

    nexus.isDeleted = true;
    await nexus.save();

    await logAdminAction(req, "SOFT_DELETE_NEXUS", "Nexus", nexusId);

    return res.status(200).json({ success: true, message: "Nexus soft-deleted successfully" });
  } catch (error) {
    console.error("[AdminNexus] Error deleting nexus:", error);
    res.status(500).json({ success: false, message: "Server error deleting nexus" });
  }
};

// Restore Soft-Deleted Nexus
export const restoreNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;

    const nexus = await Nexus.findById(nexusId);
    if (!nexus) {
      return res.status(404).json({ success: false, message: "Nexus not found" });
    }

    nexus.isDeleted = false;
    await nexus.save();

    await logAdminAction(req, "RESTORE_NEXUS", "Nexus", nexusId);

    return res.status(200).json({ success: true, message: "Nexus successfully restored", nexus });
  } catch (error) {
    console.error("[AdminNexus] Error restoring nexus:", error);
    res.status(500).json({ success: false, message: "Server error restoring nexus" });
  }
};
