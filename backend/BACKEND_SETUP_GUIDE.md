# Backend Setup & Improvements Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: Random 32+ character string
# - CONSTELLATION_PEPPER: Random 32+ character string for pattern hashing
# - CLOUDINARY_*: Your Cloudinary credentials
# - FRONTEND_URL: Your frontend URL (usually http://localhost:5173 for dev)
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5001` by default.

---

## Recent Improvements & Fixes

### Error Handling Enhancements

✅ **Cloudinary Upload Errors**: All image upload operations now have proper error handling with user-friendly messages

- Profile picture uploads
- Nexus avatar uploads
- Message image uploads

✅ **Socket.IO Connection Fallback**: Socket emission failures no longer crash the request - messages are still saved to the database

✅ **Async Error Handling**: Better error checking in constellation authentication flow

### Database Improvements

✅ **Connection Pool Optimization**:

- Max pool size: 10 connections
- Min pool size: 5 connections
- Automatic retry on transient failures
- Idle connection cleanup

✅ **Connection Event Handling**: Added monitoring for disconnections and errors

### Environment Validation

✅ **Comprehensive Startup Validation**:

- Checks all required environment variables before starting
- Production mode specific checks for CONSTELLATION_PEPPER
- Detailed error messages for missing configuration
- Better startup logging with ✓/✗ indicators

### Code Safety Improvements

✅ **Nonce-based Join Code Generation**: Added max attempts limit to prevent infinite loops in Nexus creation

✅ **Password Strength Validation**: Reset password endpoint now validates:

- Minimum 6 characters
- Maximum 128 characters

---

## API Endpoints Summary

### Authentication Routes

- `POST /api/auth/signup` - Traditional signup
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/logout` - Logout (clears cookies)
- `GET /api/auth/constellation/challenge` - Get constellation nonce
- `POST /api/auth/constellation/signup` - Constellation pattern signup
- `POST /api/auth/constellation/login` - Constellation pattern login
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with OTP
- `PUT /api/auth/update-profile` - Update user profile
- `DELETE /api/auth/delete-account` - Delete user account
- `GET /api/auth/check` - Check authentication status

### Contact Management

- `GET /api/auth/contacts` - Get user's contacts
- `POST /api/auth/contacts` - Add a contact
- `DELETE /api/auth/contacts/:contactId` - Remove contact
- `PUT /api/auth/contacts/:contactId` - Rename/alias contact

### Messages

- `GET /api/message/:id` - Get messages with a user
- `POST /api/message/:id` - Send message

### Nexus (Group Chats)

- `POST /api/nexus` - Create a nexus
- `GET /api/nexus` - Get user's nexuses
- `PUT /api/nexus/:nexusId` - Update nexus info
- `POST /api/nexus/join` - Join a nexus with code
- `POST /api/nexus/:nexusId/message` - Send message to nexus

---

## Security Features

### Constellation Authentication

- **Nonce-Protected**: Prevents replay attacks
- **Argon2id Hashing**: OWASP-recommended password hashing with salt + pepper
- **Rate Limiting**: Per-IP rate limits for auth attempts
- **Auto IP Blocking**: Blocks IPs after excessive failures
- **Behavioral Analysis**: Optional anomaly detection based on drawing patterns
- **Lockout Policy**: Escalating lockout durations (30s → 5m → 30m → 2h)

### General Security

- **Session Tracking**: All sessions stored in database, can be remotely invalidated
- **CORS Protection**: Configurable allowed origins
- **Helmet.js**: Security HTTP headers
- **HPP Protection**: HTTP Parameter Pollution protection
- **Rate Limiting**: Global and per-endpoint rate limits

### Data Protection

- **No Pattern Storage**: Constellation patterns are hashed, never stored in plaintext
- **Audit Logging**: Security events logged with IP, user agent, and risk score
- **TTL Indexes**: Old logs automatically cleaned up after 30 days

---

## Troubleshooting

### Server Won't Start

1. Check that MongoDB is running and accessible
2. Verify all required environment variables are set
3. Check that port 5001 is not in use
4. Run `npm install` to ensure dependencies are installed

### Constellation Auth Failing

1. Ensure CONSTELLATION_PEPPER is set in .env
2. Verify the nonce is being consumed properly
3. Check that edges format is correct: `[{from: "A2", to: "F1"}]`

### Image Upload Failures

1. Verify Cloudinary credentials are correct
2. Check that images are under 10MB
3. Supported formats: PNG, JPEG, WEBP, GIF
4. Check server logs for specific upload errors

### Socket.IO Issues

1. Verify FRONTEND_URL is correctly set with protocol (http/https)
2. Check that Socket.IO port is accessible from frontend
3. Ensure cookies are being sent with requests (check CORS credentials settings)

---

## Performance Optimization Tips

1. **Database Indexing**: All critical fields are indexed for fast queries
2. **Connection Pooling**: Already optimized with proper pool sizes
3. **Rate Limiting**: Prevents abuse and resource exhaustion
4. **TTL Cleanup**: Old audit logs are automatically removed

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in environment variables
- [ ] Generate strong random values for JWT_SECRET (32+ chars)
- [ ] Generate strong random value for CONSTELLATION_PEPPER (32+ chars)
- [ ] Set DEV_AUTH_BYPASS=false
- [ ] Configure MongoDB replica set for session persistence
- [ ] Set proper FRONTEND_URL values
- [ ] Configure email service for password resets
- [ ] Set up HTTPS/SSL certificates
- [ ] Enable security headers in production
- [ ] Set up logging and monitoring
- [ ] Configure backups for MongoDB
- [ ] Test all authentication flows
- [ ] Load test rate limiters

---

## Development Mode Features

### DEV_AUTH_BYPASS

When `DEV_AUTH_BYPASS=true` and `NODE_ENV=development`:

- Authentication checks are skipped
- A dev user is automatically injected: `DevUser` with email `dev@orbit.app`
- Useful for testing UI without authentication

### OTP Display

In development, generated OTPs are logged to console and returned in API responses for testing.

---

## Testing the API

### Using curl

**Get Challenge Nonce**

```bash
curl -X GET http://localhost:5001/api/auth/constellation/challenge
```

**Signup with Constellation Pattern**

```bash
curl -X POST http://localhost:5001/api/auth/constellation/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "edges": [
      {"from": "A2", "to": "F1"},
      {"from": "F1", "to": "C3"}
    ],
    "nonce": "64-character-hex-string-from-challenge"
  }'
```

---

## Questions or Issues?

Check the documentation files in the root directory:

- `ORBIT_AUTH_IMPLEMENTATION.md` - Constellation auth deep dive
- `ORBIT_AUTH_SECURITY_AUDIT.md` - Security considerations
- `README_ORBIT_AUTH.md` - High-level overview
