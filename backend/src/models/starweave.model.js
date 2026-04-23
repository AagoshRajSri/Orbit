import mongoose from 'mongoose';

const starweaveSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
    index:    true,
  },

  // Canonical node sequence hash (Argon2id)
  patternHash:  { type: String, required: true },
  patternSalt:  { type: String, required: true },
  nodeCount:    { type: Number, required: true, min: 5, max: 9 },

  // Biometric rhythm vector — averaged from two enrollment passes
  // None of these values are personally identifying in isolation
  biometric: {
    avgDwellMs:        { type: Number, default: 0 },     // mean hover dwell per node
    dwellVarianceMs:   { type: Number, default: 0 },     // std dev of dwell durations
    avgFlightVelocity: { type: Number, default: 0 },     // mean transit speed
    flightVariance:    { type: Number, default: 0 },     // std dev of flight velocities
    avgCurvature:      { type: Number, default: 0 },     // mean path curvature coefficient
    avgEntryAngle:     { type: Number, default: 0 },     // mean approach angle (radians)
    totalDurationMs:   { type: Number, default: 0 },     // total gesture time
    sampleCount:       { type: Number, default: 0 },     // number of successful logins
  },

  // Security
  failedAttempts: { type: Number, default: 0 },
  lockedUntil:    { type: Date,   default: null },
  lastFailedAt:   { type: Date,   default: null },
  nonce:          { type: String, default: null }, // last issued challenge nonce
  nonceExpiresAt: { type: Date,   default: null },

  signatureGlyphs:  { type: [String], default: [] }, // Email-hashed required signature glyphs
  emojiPoolVersion: { type: Number, default: 2 },    // rotates pool periodically
}, {
  timestamps: true,
});

export default mongoose.model('StarWeaveProfile', starweaveSchema);
