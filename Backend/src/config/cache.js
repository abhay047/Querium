import Redis from "ioredis";

let redisClient = null;

if (process.env.REDIS_HOST) {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 3000,
            maxRetriesPerRequest: 1,
            retryStrategy(times) {
                if (times > 2) return null; // Stop retrying after 2 attempts if server unreachable
                return 1000;
            }
        });

        redisClient.on("connect", () => {
            console.log("Server is connected to REDIS");
        });

        redisClient.on("error", (err) => {
            // Silently log notice without throwing unhandled error events
            if (process.env.NODE_ENV !== "production") {
                console.warn("Redis connection notice:", err.message || err);
            }
        });
    } catch (e) {
        console.warn("Redis initialization skipped:", e.message);
    }
} else {
    console.log("REDIS_HOST not set. Running in resilient mode without Redis.");
}

export async function safeRedisGet(key) {
    if (!redisClient || redisClient.status !== "ready") return null;
    try {
        return await redisClient.get(key);
    } catch (err) {
        return null;
    }
}

export async function safeRedisSet(key, value, mode, duration) {
    if (!redisClient || redisClient.status !== "ready") return false;
    try {
        if (mode && duration) {
            await redisClient.set(key, value, mode, duration);
        } else {
            await redisClient.set(key, value);
        }
        return true;
    } catch (err) {
        return false;
    }
}

export default redisClient;