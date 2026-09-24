## Why build a naive rate limiter first?

To understand the limitations of a simple implementation before introducing Redis and atomic operations.

## What did I learn?

A rate limiter is not just about counting requests. The challenge is ensuring the count remains correct when many requests arrive simultaneously.

## Next Step

Replace the naive implementation with a Redis-backed approach that avoids race conditions.

## Day 4

### Decision
Refactored the Fixed Window rate limiter after confirming the algorithm was correct.

### Why?
The original implementation worked but contained unnecessary nesting and multiple success paths.

### Changes
- Reduced nesting using guard clauses.
- Unified successful requests into a single execution path.
- Removed duplicate `next()` calls.
- Improved logging to better reflect middleware state.

### Outcome
The algorithm's behavior remained unchanged while the code became cleaner, easier to read, and easier to extend.

## Day 6 - Migrated Rate Limiter to Redis

### Decision
Replaced the in-memory JavaScript object with Redis as the storage layer.

### Why?

- In-memory storage is lost when the server restarts.
- Multiple server instances cannot share JavaScript memory.
- Redis provides atomic operations (`INCR`) and automatic expiration (`EXPIRE`).
- Simplifies the middleware by removing manual timestamp management.

### Trade-off

- Requires an external Redis server.
- Adds a network dependency.

### Benefits

- Distributed-friendly
- Production-ready storage
- Atomic request counting
- Automatic key expiration

# Day 7 - Redis Sliding Window Rate Limiter

## Decision 1
Implemented the Sliding Window Rate Limiter as a separate middleware instead of replacing the Fixed Window implementation.

Reason:
- Preserves both algorithms for comparison.
- Makes switching algorithms as simple as changing one middleware import.
- Follows a modular and extensible design.

------------------------------------------------------------

## Decision 2
Used Redis Sorted Sets (ZSET) instead of Redis Strings.

Reason:
- Fixed Window only requires storing a request count.
- Sliding Window requires storing timestamps of individual requests.
- Sorted Sets automatically maintain timestamps in sorted order, making cleanup and counting efficient.

------------------------------------------------------------

## Decision 3
Store only timestamps of accepted requests.

Reason:
- Rejected requests do not consume rate limit capacity.
- Storing rejected requests increases Redis memory usage without improving rate-limiting accuracy.
- This keeps the implementation lightweight and efficient.

------------------------------------------------------------

## Decision 4
Used the request timestamp as the Sorted Set score and a unique member value.

Reason:
- Redis allows duplicate scores but requires unique members.
- Multiple requests may occur during the same millisecond.
- Using a unique member prevents accidental overwriting of requests.

------------------------------------------------------------

## Decision 5
Always remove expired timestamps before counting requests.

Reason:
- Counting before cleanup may include expired requests.
- This could incorrectly reject valid requests.
- Cleanup ensures only requests inside the sliding window are considered.

------------------------------------------------------------

## Decision 6
Refresh the Redis key TTL after every accepted request.

Reason:
- Active users continue using the same key.
- Inactive users are automatically cleaned up by Redis.
- Prevents stale data from occupying Redis memory indefinitely.

------------------------------------------------------------

## Decision 7
Kept Fixed Window and Sliding Window implementations independent.

Reason:
- Easier testing and benchmarking.
- Better interview demonstration.
- Future algorithms (Token Bucket, Sliding Log, etc.) can be added without modifying existing implementations.

==========================================
DAY 9 ENGINEERING DECISIONS
==========================================

1. Implemented Token Bucket using Redis Hash.

Reason:
The algorithm needs to maintain multiple related values
(tokens and lastRefill) for each client.
Redis Hash stores these values under one key, making the
implementation cleaner than using multiple keys.

---------------------------------------------------------

2. Bucket Capacity

Capacity: 5 Tokens

Reason:
Keeps behaviour consistent with previous algorithms,
making comparison easier.

---------------------------------------------------------

3. Refill Strategy

1 Token every 12 seconds.

Reason:
A bucket completely refills in 60 seconds,
matching the previous rate limit of
5 requests per minute.

---------------------------------------------------------

4. Chose Hash instead of JSON String.

Reason:

- No JSON.parse()
- No JSON.stringify()
- Cleaner updates
- Demonstrates another Redis data structure.

---------------------------------------------------------

5. Limitation

Current implementation performs

Read

↓

Calculate

↓

Write

using multiple Redis operations.

This is sufficient for learning and demonstrating the
algorithm, but it is not fully atomic.

A production implementation would use a Redis Lua script
(or Redis transactions) to perform the entire operation
atomically.

---------------------------------------------------------

6. Testing

Verified

✓ Bucket creation

✓ Token consumption

✓ Token regeneration

✓ Bucket capacity never exceeded

✓ 429 responses when bucket became empty

==========================================