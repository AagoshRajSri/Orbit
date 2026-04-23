import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/user.model.js';
import WebauthnCredential from '../models/webauthnCredential.model.js';
import AmbientDevice from '../models/ambientDevice.model.js';
import FaceDescriptor from '../models/faceDescriptor.model.js';
import { generateToken } from '../lib/utils.js';

const rpName = 'Orbit Chat App';
const rpID = 'localhost';
const expectedOrigin = `http://${rpID}:5173`;

// ---- FACE LOCK (WebAuthn) ----

export const faceRegisterChallenge = async (req, res) => {
  try {
    let user;
    if (req.user) {
      user = await User.findById(req.user._id);
    } else if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userWebAuthnCredentials = await WebauthnCredential.find({ user: user._id });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user._id.toString()), 
      userName: user.username,
      // Require Face ID/Biometrics
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required', 
        residentKey: 'required',
      },
      excludeCredentials: userWebAuthnCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports,
      })),
    });

    user.webauthnCurrentChallenge = options.challenge;
    await user.save();

    res.status(200).json(options);
  } catch (error) {
    console.error('FaceLock Register Challenge Error:', error);
    res.status(500).json({ message: 'Failed to generate registration options', error: error.message });
  }
};

export const faceRegisterVerify = async (req, res) => {
  try {
    let user;
    if (req.user) {
      user = await User.findById(req.user._id);
    } else if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    }
    if (!user || !user.webauthnCurrentChallenge) return res.status(400).json({ message: 'Invalid state' });

    const expectedChallenge = user.webauthnCurrentChallenge;

    const { email, ...authResponse } = req.body;
    
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: authResponse,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

      const newCred = new WebauthnCredential({
        user: user._id,
        credentialID: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: req.body.response.transports || [],
      });

      await newCred.save();

      user.webauthnCurrentChallenge = null;
      await user.save();

      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ message: 'Verification failed' });
    }
  } catch (error) {
    console.error('FaceLock Register Verify Error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const faceLoginChallenge = async (req, res) => {
  try {
    const { email } = req.body;
    let user;
    
    if (req.user) {
        user = req.user;
    } else if (email) {
        user = await User.findOne({ email });
    }
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userWebAuthnCredentials = await WebauthnCredential.find({ user: user._id });

    if (!userWebAuthnCredentials.length) {
      return res.status(400).json({ message: 'No face credentials found for user' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userWebAuthnCredentials.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64url'),
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'required',
    });

    // Update challenge
    user.webauthnCurrentChallenge = options.challenge;
    await user.save();

    res.status(200).json({ options, userId: user._id });
  } catch (error) {
    console.error('FaceLock Login Challenge Error:', error);
    res.status(500).json({ message: 'Failed to generate authentication options', error: error.message });
  }
};

export const faceLoginVerify = async (req, res) => {
  try {
    const { userId, authResponse } = req.body;
    const user = await User.findById(userId);
    
    if (!user || !user.webauthnCurrentChallenge) return res.status(400).json({ message: 'Invalid state or user' });

    const expectedChallenge = user.webauthnCurrentChallenge;
    const credentialIDBase64url = authResponse.id;
    
    const authenticator = await WebauthnCredential.findOne({
      user: user._id,
      credentialID: credentialIDBase64url
    });

    if (!authenticator) {
      return res.status(400).json({ message: 'Authenticator not found' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: {
          credentialPublicKey: authenticator.publicKey,
          credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
          counter: authenticator.counter,
        },
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      authenticator.counter = authenticationInfo.newCounter;
      authenticator.lastUsedAt = new Date();
      await authenticator.save();

      user.webauthnCurrentChallenge = null;
      await user.save();

      // Issue token and login
      const tokens = await generateToken(user._id, req, res);

      // Return user data matching what checkAuth or login returns
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        authToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
        sessionId: tokens?.sessionId,
        message: "Face Login successful",
      });
    } else {
      res.status(400).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('FaceLock Login Verify Error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};


// ---- CAMERA FACE AUTH (face-api.js descriptor based) ----

export const cameraFaceRegister = async (req, res) => {
  try {
    const { email, descriptor } = req.body;
    if (!email || !descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face data' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await FaceDescriptor.findOneAndUpdate(
      { user: user._id },
      { descriptor, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Face registered successfully' });
  } catch (error) {
    console.error('Camera Face Register Error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const cameraFaceLogin = async (req, res) => {
  try {
    const { email, descriptor } = req.body;
    if (!email || !descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face data' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stored = await FaceDescriptor.findOne({ user: user._id });
    if (!stored) return res.status(404).json({ message: 'No face registered for this account' });

    // Euclidean distance between descriptors (threshold: 0.6)
    const dist = Math.sqrt(
      stored.descriptor.reduce((sum, val, i) => sum + Math.pow(val - descriptor[i], 2), 0)
    );

    if (dist > 0.6) {
      return res.status(401).json({ message: 'Face not recognized', distance: dist });
    }

    const tokens = await generateToken(user._id, req, res);
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      sessionId: tokens?.sessionId,
      message: 'Face authentication successful',
      distance: dist,
    });
  } catch (error) {
    console.error('Camera Face Login Error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};


// ---- AMBIENT PRESENCE ----
// Since this is a prototype integration, we'll store pairing implicitly by providing a deviceId to the setup step

export const ambientRegister = async (req, res) => {
  try {
    let user;
    if (req.user) {
      user = await User.findById(req.user._id);
    } else if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a proper TOTP secret
    const totpSecret = new OTPAuth.Secret();
    const deviceId = `dev_${crypto.randomBytes(4).toString('hex')}`;
    const desktopId = `desk_${crypto.randomBytes(4).toString('hex')}`;

    // Build OTPAuth URI for QR code
    const otpauth = new OTPAuth.TOTP({
      issuer: 'Orbit',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: totpSecret,
    });
    const uri = otpauth.toString();
    const qrDataUrl = await QRCode.toDataURL(uri);

    // Remove old device if exists, then save new one
    await AmbientDevice.deleteMany({ user: user._id });
    const newDevice = new AmbientDevice({
      user: user._id,
      deviceId,
      desktopId,
      sharedSecret: totpSecret.base32,
    });
    await newDevice.save();

    res.status(200).json({ deviceId, desktopId, qrDataUrl, secret: totpSecret.base32 });
  } catch (error) {
    console.error('Ambient Register Error:', error);
    res.status(500).json({ message: 'Failed to generate ambient configuration' });
  }
};

// ---- BLUETOOTH AMBIENT PRESENCE ----

export const bluetoothRegister = async (req, res) => {
  try {
    const { email, bluetoothDeviceId, deviceName } = req.body;
    if (!email || !bluetoothDeviceId) return res.status(400).json({ message: 'Missing bluetooth data' });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Store as an ambient device
    await AmbientDevice.findOneAndUpdate(
      { user: user._id, bluetoothDeviceId: { $exists: true } },
      { 
        bluetoothDeviceId, 
        deviceName: deviceName || 'Bluetooth Phone',
        deviceId: bluetoothDeviceId, // reuse for common ID
        desktopId: 'browser',
        sharedSecret: crypto.randomBytes(20).toString('hex'), // unused for BT but schema needs it
        lastSeenAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Bluetooth device registered' });
  } catch (error) {
    console.error('Bluetooth Register Error:', error);
    res.status(500).json({ message: 'Failed to register bluetooth device' });
  }
};

export const bluetoothVerify = async (req, res) => {
  try {
    const { bluetoothDeviceId } = req.body;
    if (!bluetoothDeviceId) return res.status(400).json({ message: 'Missing device info' });

    const device = await AmbientDevice.findOne({ bluetoothDeviceId });
    if (!device) return res.status(401).json({ message: 'Device not recognized' });

    const user = await User.findById(device.user);
    const tokens = await generateToken(user._id, req, res);

    device.lastSeenAt = new Date();
    await device.save();

    res.status(200).json({
      valid: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      authToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      sessionId: tokens?.sessionId,
    });
  } catch (error) {
    console.error('Bluetooth Verify Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ---- CLOUD TETHERING (No-Bluetooth Fallback) ----

// ---- CLOUD TETHERING: ONE-TAP AUTH ----

export const tetherRegister = async (req, res) => {
  try {
    const { email } = req.body;
    const tetherToken = crypto.randomBytes(32).toString('hex');
    const tetherId = `t-id-${crypto.randomBytes(4).toString('hex')}`;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Store the pending tether session
    await AmbientDevice.findOneAndUpdate(
      { user: user._id, type: 'tether' },
      { 
        deviceId: tetherId,
        sharedSecret: tetherToken,
        deviceName: 'Cloud Tether Key',
        lastSeenAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Provide the mobile approval URL (MUST point to the FRONTEND, not backend)
    const frontendBase = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
    const approvalUrl = `${frontendBase}/tether/approve?id=${tetherId}&token=${tetherToken}`;
    const qrDataUrl = await QRCode.toDataURL(approvalUrl);

    res.status(200).json({ tetherId, tetherToken, approvalUrl, qrDataUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to init tether link' });
  }
};

export const tetherApprove = async (req, res) => {
  try {
    const { tetherId, tetherToken } = req.body;
    const device = await AmbientDevice.findOne({ deviceId: tetherId, sharedSecret: tetherToken });
    
    if (!device) return res.status(401).json({ message: 'Tether link expired' });

    const user = await User.findById(device.user);
    const tokens = await generateToken(user._id, req, res);

    // ---- SOCKET BROADCAST ----
    // We emit an event to the specific tether session room to tell the desktop it's approved
    if (global.io) {
      global.io.to(tetherId).emit('tether:approved', {
        valid: true,
        username: user.username,
        authToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
        sessionId: tokens?.sessionId,
      });
    }

    res.status(200).json({ message: 'Access granted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Tether approval error' });
  }
};

export const ambientVerify = async (req, res) => {
  try {
    const { deviceId, token } = req.body;
    if (!deviceId || !token) return res.status(400).json({ valid: false, message: 'Missing parameters' });

    const device = await AmbientDevice.findOne({ deviceId });
    if (!device) return res.status(400).json({ valid: false, message: 'Device not registered' });

    // Verify the real TOTP using otpauth
    const otpauth = new OTPAuth.TOTP({
      issuer: 'Orbit',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(device.sharedSecret),
    });
    const delta = otpauth.validate({ token, window: 1 });
    if (delta === null) {
      return res.status(401).json({ valid: false, message: 'Invalid or expired OTP' });
    }

    device.lastSeenAt = new Date();
    await device.save();

    const user = await User.findById(device.user);
    const tokens = await generateToken(user._id, req, res);

    res.status(200).json({
      valid: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      authToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      sessionId: tokens?.sessionId,
    });
  } catch (error) {
    console.error('Ambient Verify Error:', error);
    res.status(500).json({ valid: false, message: 'Verification failed', error: error.message });
  }
};
