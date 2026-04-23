import mongoose from 'mongoose';

const webauthnCredentialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  credentialID: {
    type: String,
    required: true,
    unique: true,
  },
  publicKey: {
    type: Buffer,
    required: true,
  },
  counter: {
    type: Number,
    required: true,
    default: 0,
  },
  deviceType: {
    type: String,
    default: 'singleDevice',
  },
  backedUp: {
    type: Boolean,
    default: false,
  },
  transports: {
    type: [String],
    default: [],
  },
  deviceName: {
    type: String,
    default: 'Authenticator',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  }
});

const WebauthnCredential = mongoose.model('WebauthnCredential', webauthnCredentialSchema);

export default WebauthnCredential;
