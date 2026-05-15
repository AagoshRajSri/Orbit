import Nexus from "../models/nexus.model.js";
import Message from "../models/message.model.js";
import NexusSenderKeyDistribution from "../models/nexusSenderKeyDistribution.model.js";
import PrekeyBundle from "../models/prekeyBundle.model.js";
import { getIO, emitToNexus } from "../socket/socket.js";
import { getRealId, sanitizeForOrbit } from "../lib/obfuscation.js";
import cloudinary from "../lib/cloudinary.js";
import { systemEmitter } from "../lib/systemEmitter.js";
import { z } from "zod";

const escapeHtml = (str) => {
  if (!str) return "";
  const htmlEscapes = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(str).replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

const sanitizeUsername = (username) => escapeHtml(String(username || "Unknown"));

const nexusDataSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(500).optional(),
  avatar: z
    .string()
    .regex(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      "Only explicit PNG, JPEG, or WEBP base64 images are supported",
    )
    .optional(),
});

const nexusMessageSchema = z
  .object({
    text:           z.string().max(2000).optional(),
    image:          z.string().max(5000000).optional(),
    idempotencyKey: z.string().optional(),
    // ── v4: Sender Key encrypted group message ──────────────────────────────
    v:          z.number().int().min(1).max(10).optional(),
    ciphertext: z.string().optional(), // AES-GCM encrypted payload
    iv:         z.string().optional(), // 96-bit IV
    n:          z.number().int().optional(), // Chain counter
    sig:        z.string().optional(), // ECDSA signature
  })
  .refine(
    (data) => data.text || data.image || data.ciphertext,
    { message: "Message must contain either text, image, or encrypted content" }
  );

export const getNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId = req.user._id;

    const nexus = await Nexus.findById(nexusId)
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic");

    if (!nexus) {
      console.warn(`[Nexus 404] Nexus ${nexusId} not found`);
      return res.status(404).json({ message: "Nexus not found" });
    }

    const isMember = nexus.members && nexus.members.some((m) => {
      const memberId = m._id ? m._id.toString() : m.toString();
      return memberId === userId.toString();
    });

    if (!isMember) {
      // Detailed logging for debugging membership issues
      const memberIds = (nexus.members || []).map(m => 
        m._id ? m._id.toString() : m.toString()
      );
      
      console.warn(
        `[Nexus 403] User ${userId} denied access to ${nexusId}`,
        {
          nexusName: nexus.name,
          nexusCreatorId: nexus.creator?._id?.toString(),
          memberCount: nexus.members?.length || 0,
          memberIds: memberIds.slice(0, 3), // Log first 3 members for reference
          userIdType: typeof userId,
          userIdString: userId.toString(),
        }
      );
      
      return res.status(403).json({ 
        message: "Access denied: Not a member of this Nexus",
        debug: process.env.NODE_ENV === "development" ? {
          memberCount: nexus.members?.length,
          userIsInList: memberIds.includes(userId.toString()),
        } : undefined
      });
    }

    res.status(200).json(nexus);
  } catch (error) {
    console.error("Error in getNexus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createNexus = async (req, res) => {
  try {
    const parsed = nexusDataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.errors,
      });
    }

    const { name, description, avatar } = parsed.data;
    const creatorId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Nexus name is required" });
    }

    // Generate a unique 6-character random join code
    let joinCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!isUnique && attempts < maxAttempts) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await Nexus.findOne({ joinCode });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return res
        .status(500)
        .json({
          message: "Failed to generate unique Nexus code. Please try again.",
        });
    }

    let avatarUrl = "";
    if (avatar) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(avatar, {
          folder: "orbit_nexuses",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        });
        avatarUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error(
          "Cloudinary upload failed in createNexus:",
          uploadError.message,
        );
        return res.status(400).json({
          message:
            "Failed to upload avatar. Please try again with a smaller image.",
          error:
            process.env.NODE_ENV === "development"
              ? uploadError.message
              : undefined,
        });
      }
    }

    const newNexus = new Nexus({
      name,
      description,
      joinCode,
      creator: creatorId,
      members: [creatorId],
      avatar: avatarUrl,
    });

    await newNexus.save();

    // Populate creator details reliably by re-fetching
    const populatedNexus = await Nexus.findById(newNexus._id)
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic");

    const io = getIO();
    io.to(creatorId.toString()).emit("nexusJoined", populatedNexus);

    systemEmitter.broadcast('nexus_created', { nexusId: populatedNexus._id, name: populatedNexus.name, creatorId });

    res.status(201).json(sanitizeForOrbit(populatedNexus.toObject()));
  } catch (error) {
    console.error("Error in createNexus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeNexusMember = async (req, res) => {
  try {
    const removeSchema = z.object({
      nexusId: z.string().min(1),
      memberId: z.string().min(1),
    });

    const parsed = removeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { nexusId, memberId } = parsed.data;
    const userId = req.user._id;

    const nexus = await Nexus.findById(nexusId).populate("members", "username _id");
    if (!nexus) {
      return res.status(404).json({ message: "Nexus not found" });
    }

    if (nexus.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only host can manage this Nexus" });
    }

    if (!memberId || memberId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Invalid member" });
    }

    const removedMember = nexus.members.find(
      (m) => m._id.toString() === memberId.toString(),
    );
    const removedUsername = removedMember?.username || "A member";

    nexus.members = nexus.members.filter(
      (id) => id._id.toString() !== memberId.toString(),
    );
    await nexus.save();

    const populatedNexus = await Nexus.findById(nexus._id)
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic");

    const realNexusId = nexus._id.toString();
    const io = getIO();
    const safeUsername = sanitizeUsername(req.user.username);
    const systemMsg = new Message({
      senderId: userId,
      nexusId: realNexusId,
      text: `${safeUsername} removed a member from the Nexus`,
      isSystem: true,
    });
    await systemMsg.save();

    // Construct populated system message manually
    const populated = {
      ...systemMsg.toObject(),
      senderId: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
    };
    io.to(realNexusId).emit("newNexusMessage", populated);

    io.to(realNexusId).emit("memberRemovedFromNexus", {
      nexusId: nexusId, // Keep obfuscated ID for client matching
      userId: memberId,
      username: removedUsername,
    });

    res.status(200).json(populatedNexus);
  } catch (error) {
    console.error("Error in removeNexusMember:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId = req.user._id;
    const parsed = nexusDataSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input data", errors: parsed.error.errors });
    }

    const { name, description, avatar } = parsed.data;
    const nexus = await Nexus.findById(nexusId);

    if (!nexus) return res.status(404).json({ message: "Nexus not found" });

    if (nexus.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only host can update nexus" });
    }

    if (name) nexus.name = name;
    if (description) nexus.description = description;

    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar, {
        folder: "orbit_nexuses",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      });
      nexus.avatar = uploadResponse.secure_url;
    }

    await nexus.save();

    const populated = await Nexus.findById(nexus._id)
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic");

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in updateNexus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const joinNexus = async (req, res) => {
  try {
    const userId = req.user._id;
    const joinSchema = z.object({
      joinCode: z.string().min(1, "Join code is required").max(20).trim(),
    });

    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { joinCode } = parsed.data;

    const nexus = await Nexus.findOne({ joinCode: joinCode.toUpperCase() });

    if (!nexus) {
      console.warn(`[Nexus] Join failed - code not found: ${joinCode}`);
      return res.status(404).json({ message: "Nexus not found" });
    }

    // Use string comparison because Mongoose ObjectIds are not reference-equal
    // when fetched from different queries.
    if (
      nexus.members.some(
        (memberId) => memberId.toString() === userId.toString(),
      )
    ) {
      console.info(`[Nexus] User ${userId} already member of ${nexus._id}`);
      return res
        .status(400)
        .json({ message: "You are already a member of this Nexus" });
    }

    nexus.members.push(userId);
    await nexus.save();

    console.info(`[Nexus] User ${userId} joined ${nexus._id}`, {
      nexusName: nexus.name,
      memberCount: nexus.members.length,
    });

    const populatedNexus = await Nexus.findById(nexus._id)
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic");

    // Inform other members via socket (optional but good for "User joined" notifications)
    const io = getIO();

    const systemMsg = new Message({
      senderId: userId,
      nexusId: nexus._id,
      text: `${sanitizeUsername(req.user.username)} joined the Nexus`,
      isSystem: true,
    });
    await systemMsg.save();

    const populated = {
      ...systemMsg.toObject(),
      senderId: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
    };
    io.to(nexus._id.toString()).emit("newNexusMessage", populated);

    io.to(nexus._id.toString()).emit("userJoinedNexus", {
      nexusId: nexus._id,
      userId,
      username: req.user.username,
    });

    io.to(userId.toString()).emit("nexusJoined", populatedNexus);

    res.status(200).json(populatedNexus);
  } catch (error) {
    console.error("Error in joinNexus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyNexuses = async (req, res) => {
  try {
    const userId = req.user._id;
    const nexuses = await Nexus.find({ members: userId })
      .populate("creator", "username profilePic")
      .populate("members", "username profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(sanitizeForOrbit(nexuses.map(n => n.toObject())));
  } catch (error) {
    console.error("Error in getMyNexuses:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

  export const getNexusMessages = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const realNexusId = getRealId(nexusId);
    const userId = req.user._id;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    // Check if user is a member
    const nexus = await Nexus.findById(realNexusId);
    if (
      !nexus ||
      !nexus.members.some((id) => id.toString() === userId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = { nexusId: realNexusId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("senderId", "username profilePic")
      .maxTimeMS(5000) // FIX 17: Prevent thread stall
      .lean();

    messages = messages.reverse();

    // Sanitize IDs to match the format of socket-emitted nexus messages (obfuscated).
    // Without this, loaded messages have real MongoDB IDs but incoming socket messages
    // have obfuscated IDs — causing isNexusMatch() in addNexusMessage to fail.
    res.status(200).json(sanitizeForOrbit(messages));
  } catch (error) {
    console.error("Error in getNexusMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendNexusMessage = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const senderId = req.user._id;

    const parsed = nexusMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.errors,
      });
    }

    const { text, image, idempotencyKey, v, ciphertext, iv, n, sig } = parsed.data;

    // Idempotency check: if we already saved this message, return it immediately
    if (idempotencyKey) {
      const existing = await Message.findOne({ idempotencyKey }).populate(
        "senderId",
        "username profilePic"
      );
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    // Check if user is a member
    const realNexusId = getRealId(nexusId);
    const nexus = await Nexus.findById(realNexusId);
    if (!nexus) {
      return res.status(404).json({ message: "Nexus not found" });
    }

    const isMember = nexus.members && nexus.members.some((member) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === senderId.toString();
    });

    if (!isMember) {
      return res.status(403).json({ message: "Access denied: Not a member of this Nexus" });
    }

    let imageUrl = image;
    if (image && image.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "orbit_chats",
        transformation: [
          { width: 1200, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      nexusId: realNexusId,
      text,
      image: imageUrl,
      idempotencyKey,
      // v4: Sender Key encrypted group message
      v,
      ciphertext,
      iv,
      n,
      sig,
    });

    await newMessage.save();

    const populatedMessage = {
      ...newMessage.toObject(),
      _id: newMessage._id.toString(),
      senderId: {
        _id: req.user._id.toString(),
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
      nexusId: realNexusId.toString(),
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString(),
    };

    // Emit to all nexus members using the REAL room ID
    try {
      const sanitizedMessage = sanitizeForOrbit(populatedMessage);
      emitToNexus(realNexusId, "newNexusMessage", sanitizedMessage);
    } catch (socketError) {
      console.warn("Nexus socket emission failed:", socketError.message);
    }

    res.status(201).json(sanitizeForOrbit(populatedMessage));
  } catch (error) {
    console.error("Error in sendNexusMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId = req.user._id;

    const nexus = await Nexus.findById(nexusId);
    if (
      !nexus ||
      !nexus.members.some((id) => id.toString() === userId.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (nexus.creator.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Host cannot leave. Delete nexus or transfer host." });
    }

    nexus.members = nexus.members.filter(
      (id) => id.toString() !== userId.toString(),
    );
    await nexus.save();

    const realNexusIdStr = nexus._id.toString();
    const systemMsg = new Message({
      senderId: userId,
      nexusId: realNexusIdStr,
      text: `${sanitizeUsername(req.user.username)} left the Nexus`,
      isSystem: true,
    });
    await systemMsg.save();

    const populated = {
      ...systemMsg.toObject(),
      senderId: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
    };

    const io = getIO();
    io.to(realNexusIdStr).emit("newNexusMessage", populated);
    io.to(realNexusIdStr).emit("userLeftNexus", {
      nexusId: nexusId, // Keep obfuscated ID for client
      userId,
      username: req.user.username,
    });

    res.status(200).json({ message: "Left successfully" });
  } catch (error) {
    console.error("Error in leaveNexus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Diagnostic endpoint: Check membership status
export const checkMembership = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId = req.user._id;

    const nexus = await Nexus.findById(nexusId)
      .populate("creator", "username _id")
      .populate("members", "username _id");

    if (!nexus) {
      return res.status(404).json({
        status: "not_found",
        message: "Nexus not found",
        nexusId,
      });
    }

    const memberIds = (nexus.members || []).map(m => 
      m._id ? m._id.toString() : m.toString()
    );

    const isMember = memberIds.includes(userId.toString());

    const diagnostics = {
      status: isMember ? "member" : "not_member",
      nexusId,
      nexusName: isMember ? nexus.name : "Private Nexus",
      userId: userId.toString(),
      isMember,
      timestamp: new Date().toISOString(),
    };

    if (isMember) {
      diagnostics.memberCount = nexus.members?.length || 0;
      diagnostics.isCreator = nexus.creator?._id?.toString() === userId.toString();
      diagnostics.creatorId = nexus.creator?._id?.toString();
      diagnostics.memberIds = memberIds; // All member IDs for debugging
    }

    console.info("[Nexus Diagnostic] Membership check:", diagnostics);
    res.status(200).json(diagnostics);
  } catch (error) {
    console.error("Error in checkMembership:", error.message);
    res.status(500).json({ 
      status: "error",
      message: "Failed to check membership",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const deleteNexus = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId = req.user._id;

    const nexus = await Nexus.findById(nexusId);
    if (!nexus) {
      return res.status(404).json({ message: "Nexus not found" });
    }

    if (nexus.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the creator can delete this Nexus" });
    }

    // Delete all messages associated with this nexus
    await Message.deleteMany({ nexusId });
    
    // Delete the nexus itself
    await Nexus.findByIdAndDelete(nexusId);

    // Notify members via socket
    const io = getIO();
    io.to(nexusId).emit("nexusDeleted", { nexusId });

    res.status(200).json({ message: "Nexus deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNexus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Sender Key Distribution API ───────────────────────────────────────────────

/**
 * POST /api/nexus/:nexusId/sender-keys
 * Alice stores her X3DH-wrapped SenderKey for each nexus member.
 * Body: { distributions: [{ recipientId, ciphertext, iv, x3dh }] }
 */
export const publishSenderKeyDistributions = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const senderId    = req.user._id;
    const realNexusId = getRealId(nexusId);

    const schema = z.object({
      distributions: z.array(z.object({
        recipientId:  z.string().min(1),
        ciphertext:   z.string().min(1),
        iv:           z.string().min(1),
        x3dh: z.object({
          identityKey:  z.string(),
          ephemeralKey: z.string(),
          opkId:        z.string().nullable().optional(),
        }),
      })).min(1).max(500),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parsed.error.issues },
      });
    }

    // Verify sender is a nexus member
    const nexus = await Nexus.findById(realNexusId).select("members");
    if (!nexus || !nexus.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not a member" } });
    }

    const { distributions } = parsed.data;

    // Upsert each distribution — replace on key rotation
    const ops = distributions.map(({ recipientId, ciphertext, iv, x3dh }) => ({
      updateOne: {
        filter: {
          nexusId:     realNexusId,
          senderId,
          recipientId: getRealId(recipientId),
        },
        update: { $set: { ciphertext, iv, x3dh, updatedAt: new Date() } },
        upsert: true,
      },
    }));
    await NexusSenderKeyDistribution.bulkWrite(ops);

    return res.status(200).json({ success: true, count: distributions.length });
  } catch (error) {
    console.error("[Nexus] publishSenderKeyDistributions error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/nexus/:nexusId/sender-keys
 * Bob fetches all sender key distributions addressed to him for this nexus.
 */
export const getSenderKeyDistributions = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId      = req.user._id;
    const realNexusId = getRealId(nexusId);

    const distributions = await NexusSenderKeyDistribution.find({
      nexusId:     realNexusId,
      recipientId: userId,
    }).lean();

    return res.status(200).json({
      success: true,
      distributions: sanitizeForOrbit(distributions),
    });
  } catch (error) {
    console.error("[Nexus] getSenderKeyDistributions error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/nexus/:nexusId/member-keys
 * Return prekey bundles for all nexus members except the caller.
 * Used before publishing sender key distributions.
 */
export const getMemberPublicKeys = async (req, res) => {
  try {
    const { nexusId } = req.params;
    const userId      = req.user._id;
    const realNexusId = getRealId(nexusId);

    const nexus = await Nexus.findById(realNexusId).select("members");
    if (!nexus || !nexus.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
    }

    const memberIds = nexus.members
      .map((m) => m.toString())
      .filter((id) => id !== userId.toString());

    const bundles = await PrekeyBundle.find({ userId: { $in: memberIds } })
      .select("userId identityKey signingKey signedPrekey spkSignature oneTimePrekeys")
      .lean();

    // Pop one OPK per member atomically
    const result = [];
    for (const bundle of bundles) {
      let oneTimePrekey   = null;
      let oneTimePrekeyId = null;

      if (bundle.oneTimePrekeys?.length > 0) {
        const opk = bundle.oneTimePrekeys[0];
        await PrekeyBundle.updateOne(
          { userId: bundle.userId },
          { $pull: { oneTimePrekeys: { id: opk.id } } }
        );
        oneTimePrekey   = opk.publicKey;
        oneTimePrekeyId = opk.id;
      }

      result.push({
        userId:          bundle.userId.toString(),
        identityKey:     bundle.identityKey,
        signingKey:      bundle.signingKey,
        signedPrekey:    bundle.signedPrekey,
        prekeySignature: bundle.spkSignature,
        oneTimePrekey,
        oneTimePrekeyId,
      });
    }

    return res.status(200).json({ success: true, members: sanitizeForOrbit(result) });
  } catch (error) {
    console.error("[Nexus] getMemberPublicKeys error:", error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR" } });
  }
};

