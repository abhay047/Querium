import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on("connect", () => {
    console.log("Server is connected to REDIS");
});

redis.on("error", (err) => {
    console.error("Redis connection warning/error:", err.message || err);
});

export default redis;