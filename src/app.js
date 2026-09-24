const express = require("express");
const naiveRateLimiter = require("./middleware/naiveRateLimiter");
const fixedWindowRateLimiter = require("./middleware/fixedWindowRateLimiter");
const slidingWindowRateLimiter = require("./middleware/slidingWindowRateLimiter");
const tokenBucketRateLimiter = require("./middleware/tokenBucketRateLimiter");
const testRoute = require("./routes/testRoute");

const app = express();

// app.use(naiveRateLimiter);
// app.use(fixedWindowRateLimiter);
// app.use(slidingWindowRateLimiter);
app.use(tokenBucketRateLimiter);
app.use(testRoute);

module.exports = app;