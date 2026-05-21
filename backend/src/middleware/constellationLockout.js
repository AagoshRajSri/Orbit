import { redisClient, isRedisAvailable } from '../lib/redis.js';

export const constellationLockout = async (req, res, next) => {
  const identifier = req.body?.username || req.body?.email;
  if (!identifier) return next();

  const key = `lockout:constellation:${identifier}`;
  
  try {
    if (isRedisAvailable) {
      const ttl = await redisClient.pttl(key);
      if (ttl > 0) {
        const attempts = await redisClient.get(key);
        if (attempts && parseInt(attempts) >= 5) {
          return res.status(429).json({
            error: 'Too many attempts. Try again in 15 minutes.',
            retryAfter: Math.ceil(ttl / 1000)
          });
        }
      }

      req.recordConstellationAttempt = async (success) => {
        if (success) {
          await redisClient.del(key);
        } else {
          const attempts = await redisClient.incr(key);
          if (attempts === 1) {
            await redisClient.expire(key, 15 * 60);
          } else if (attempts >= 5) {
            await redisClient.expire(key, 15 * 60);
          }
        }
      };
    } else {
      // Fallback if Redis is not available
      req.recordConstellationAttempt = async () => {};
    }
    next();
  } catch (err) {
    console.error('constellationLockout error:', err);
    next();
  }
};
