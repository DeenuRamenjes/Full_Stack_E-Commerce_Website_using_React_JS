import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

// Initialize Redis client
const redis = new Redis(process.env.UPSTASH_REDIS_URI || 'redis://localhost:6379')

// Test connection
redis.on('connect', () => {
    console.log('Redis connected successfully');
});

redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});

export default redis
