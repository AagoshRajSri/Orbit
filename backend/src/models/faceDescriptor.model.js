import mongoose from 'mongoose';

const faceDescriptorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // 128-element face descriptor vector stored as JSON array
  descriptor: {
    type: [Number],
    required: true,
    validate: {
      validator: v => v.length === 128,
      message: 'Face descriptor must have exactly 128 values',
    },
  },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const FaceDescriptor = mongoose.model('FaceDescriptor', faceDescriptorSchema);
export default FaceDescriptor;
