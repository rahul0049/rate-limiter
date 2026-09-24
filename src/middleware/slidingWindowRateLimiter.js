const redis = require("../config/redisClient");

const { randomUUID } = require("crypto");
const WINDOW_SIZE = 60 * 1000;
const MAX_REQUESTS = 5;

async function slidingWindowRateLimiter(req, res, next) {

    const ip = req.ip;
    const key = `requests:${ip}`;

    const currentTime = Date.now();
    const windowStart = currentTime - WINDOW_SIZE;

    console.log("\n==============================");
    console.log(`Request from: ${ip}`);
    console.log(`Current Time : ${currentTime}`);
    console.log(`Window Start : ${windowStart}`);

    try {

        console.log("\nRemoving expired timestamps...");

        const removed = await redis.zremrangebyscore(
            key,
            0,
            `(${windowStart}`
        );

        console.log(`Expired timestamps removed: ${removed}`);

        const count = await redis.zcard(key);

        console.log(`Current Requests in Window : ${count}`);

        if (count >= MAX_REQUESTS) {
            console.log(" Request Rejected (429)");
            console.log("==============================");
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later."
            });
        }

        const member = randomUUID();

        await redis.zadd(key, currentTime, member);

        const newCount = await redis.zcard(key);

        console.log(`Stored Timestamp           : ${currentTime}`);
        console.log(`Requests After Insert      : ${newCount}`);

        await redis.expire(key, 60);

        const ttl = await redis.ttl(key);

        console.log(`TTL Refreshed              : ${ttl} seconds`);
        console.log("Request Allowed");
        console.log("==============================");

        return next();

    } catch (error) {

        console.error("\nSliding Window Rate Limiter Error:" , error.message);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }

}

module.exports = slidingWindowRateLimiter;