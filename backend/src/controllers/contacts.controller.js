import User from "../models/user.model.js";
import ContactRequest from "../models/contactRequest.model.js";
import { sanitizeForOrbit } from "../lib/obfuscation.js";

// Ensure socket is imported correctly to emit events
// Assuming getIO() exists
import { getIO } from "../socket/socket.js";

export const searchContacts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(200).json([]);
    }

    const currentUserId = req.user._id;

    // We shouldn't return users that have blocked the current user,
    // or users the current user has blocked.
    // Also exclude the current user.
    const currentUser = await User.findById(currentUserId).select("blockedContacts");
    const myBlocked = currentUser.blockedContacts || [];

    const queryStr = q.toLowerCase();
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: myBlocked } },
        { blockedContacts: { $ne: currentUserId } },
        {
          $or: [
            { username: { $regex: `^${queryStr}`, $options: "i" } },
            { orbitId: queryStr },
          ],
        },
      ],
    })
      .select("_id username orbitId orbitTag profilePic")
      .limit(20)
      .lean();

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const sendContactRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId || receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ error: "Invalid receiver" });
    }

    // Check if receiver exists and is not blocked
    const receiver = await User.findById(receiverId).select("blockedContacts contacts");
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    if (receiver.blockedContacts?.includes(senderId)) {
      return res.status(403).json({ error: "Cannot send request to this user" });
    }

    // Check if already contacts
    if (receiver.contacts?.includes(senderId)) {
      return res.status(400).json({ error: "Already contacts" });
    }

    // Check if there is already a pending request
    const existingReq = await ContactRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ],
      status: 'pending'
    });

    if (existingReq) {
      return res.status(400).json({ error: "Request already pending" });
    }

    // Create the request
    const newReq = await ContactRequest.create({ senderId, receiverId });

    const senderProfile = await User.findById(senderId).select("_id username orbitId orbitTag profilePic");

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(receiverId.toString()).emit("contact:request_received", {
        _id: newReq._id,
        sender: senderProfile,
        createdAt: newReq.createdAt
      });
    }

    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Request already exists" });
    }
    next(err);
  }
};

export const acceptContactRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const receiverId = req.user._id;

    const contactReq = await ContactRequest.findOne({ _id: requestId, receiverId, status: 'pending' });
    if (!contactReq) {
      return res.status(404).json({ error: "Request not found" });
    }

    contactReq.status = 'accepted';
    await contactReq.save();

    const senderId = contactReq.senderId;

    await User.findByIdAndUpdate(receiverId, {
      $addToSet: { contacts: senderId }
    });
    
    await User.findByIdAndUpdate(senderId, {
      $addToSet: { contacts: receiverId }
    });

    // Emit socket events
    const io = getIO();
    if (io) {
      io.to(senderId.toString()).emit("contact:accepted", {
        contactId: receiverId.toString()
      });
      io.to(receiverId.toString()).emit("contact:accepted", {
        contactId: senderId.toString()
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const declineContactRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const receiverId = req.user._id;

    const contactReq = await ContactRequest.findOneAndUpdate(
      { _id: requestId, receiverId, status: 'pending' },
      { status: 'declined' },
      { new: true }
    );

    if (!contactReq) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getPendingRequests = async (req, res, next) => {
  try {
    const receiverId = req.user._id;

    const requests = await ContactRequest.find({ receiverId, status: 'pending' })
      .populate("senderId", "_id username orbitId orbitTag profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Map senderId -> sender
    const formatted = requests.map(r => ({
      _id: r._id,
      sender: r.senderId,
      createdAt: r.createdAt
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};
