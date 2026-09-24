const requestCounts = {};

const LIMIT = 5;

function naiveRateLimiter(req, res, next) {
    const ip = req.ip;

    if (!requestCounts[ip]) {
        requestCounts[ip] = 0;
    }

    requestCounts[ip]++;

    console.log(requestCounts);

    if (requestCounts[ip] > LIMIT) {
        return res.status(429).json({
            message: "Too Many Requests"
        });
    }

    next();
}

module.exports = naiveRateLimiter;