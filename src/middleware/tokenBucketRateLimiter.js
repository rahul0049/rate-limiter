const redis = require("../config/redisClient");

const BUCKET_CAPACITY = 5;
const REFILL_RATE = 1;
const REFILL_INTERVAL = 12 * 1000;

async function tokenBucketRateLimiter(req, res, next) {
    try {

        const ip = req.ip;
        const key = `bucket:${ip}`;
        const currentTime = Date.now();

        console.log("\n------------------------------");
        console.log(`Request from: ${ip}`);

        const bucket = await redis.hgetall(key);

        let tokens;
        let lastRefill;

        if (Object.keys(bucket).length === 0) {
            console.log("New Bucket Created");

            tokens = BUCKET_CAPACITY;
            lastRefill = currentTime;
        } else {
            tokens = Number(bucket.tokens);
            lastRefill = Number(bucket.lastRefill);

            console.log(`Stored Tokens : ${tokens}`);
        }

        const elapsedTime = currentTime - lastRefill;

        const regeneratedTokens =
            Math.floor(elapsedTime / REFILL_INTERVAL) * REFILL_RATE;

        console.log(`Elapsed Time : ${(elapsedTime / 1000).toFixed(2)} sec`);
        console.log(`Tokens Regenerated : ${regeneratedTokens}`);

        tokens = Math.min(
            BUCKET_CAPACITY,
            tokens + regeneratedTokens
        );

        lastRefill = currentTime;

        console.log(`Available Tokens : ${tokens}`);

        if (tokens <= 0) {

            console.log("Rate Limit Exceeded");

            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later."
            });
        }

        tokens--;

        console.log(`Remaining Tokens : ${tokens}`);

        await redis.hset(key, {
            tokens,
            lastRefill
        });

        console.log("Bucket Updated in Redis");

        console.log("Request Allowed");

        return next();

    } catch (error) {

        console.error("Token Bucket Error:", error.message);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
}

module.exports = tokenBucketRateLimiter;