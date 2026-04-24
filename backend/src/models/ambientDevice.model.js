import mongoose from 'mongoose';

const ambientDeviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  desktopId: {
    type: String,
    required: true,
  },
  sharedSecret: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    default: 'Mobile Device',
  },
  bluetoothDeviceId: {
    type: String,
    sparse: true,
  },
  type: {
    type: String,
    enum: ['bluetooth', 'tether'],
    default: 'bluetooth'
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    }
  }
});

ambientDeviceSchema.index({ location: "2dsphere" });

const AmbientDevice = mongoose.model('AmbientDevice', ambientDeviceSchema);

export default AmbientDevice;
