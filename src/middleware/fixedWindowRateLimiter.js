const redis = require("../config/redisClient");

const MAX_REQUESTS = 5;
const WINDOW_SIZE = 60;

async function fixedWindowRateLimiter(req, res, next) {

    try {

        const ip = req.ip;
        const key = `requests:${ip}`;

        console.log("\n------------------------------");
        console.log(`Request from: ${ip}`);
        console.log(`Redis Key: ${key}`);

        const count = await redis.incr(key);

        console.log(`Current Count: ${count}`);

        if (count === 1) {
            await redis.expire(key, WINDOW_SIZE);
            console.log("New window started (TTL = 60 sec)");
        }

        const ttl = await redis.ttl(key);

        console.log(`Time Remaining: ${ttl} sec`);

        if (count > MAX_REQUESTS) {
            console.log(" Rate Limit Exceeded");
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later."
            });
        }
        console.log(" Request Allowed");

        console.log("------------------------------");
        return next();

    } catch (err) {

        console.error("Rate limiter error:", err.message);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

}

module.exports = fixedWindowRateLimiter;