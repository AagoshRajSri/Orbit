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
  }
});

const AmbientDevice = mongoose.model('AmbientDevice', ambientDeviceSchema);

export default AmbientDevice;
