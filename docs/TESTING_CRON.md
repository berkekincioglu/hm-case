# Testing the Scheduled Data Fetching

## 🧪 Quick Test Guide

### 1. Test Cron Endpoint Locally

**Start the dev server:**

```bash
npm run dev
```

**Test authentication (should fail):**

```bash
curl -X POST http://localhost:3000/api/cron/fetch-data \
  -H "Authorization: Bearer wrong-secret" \
  -H "Content-Type: application/json"
```

**Expected response:**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Test with correct secret:**

```bash
curl -X POST http://localhost:3000/api/cron/fetch-data \
  -H "Authorization: Bearer dev-secret-for-local-testing-only" \
  -H "Content-Type: application/json"
```

**Expected response (after ~2-3 minutes):**

```json
{
  "success": true,
  "data": {
    "message": "Data fetch completed successfully",
    "timestamp": "2025-10-18T20:30:00.000Z"
  }
}
```

---

### 2. Verify Data in Database

**Open Prisma Studio:**

```bash
npm run studio
```

**Check data counts:**

```bash
# Connect to PostgreSQL
docker exec -it hypermonk-case-postgres-1 psql -U postgres -d crypto_dashboard

# Run queries
SELECT COUNT(*) FROM "Coin";                    -- Should be 11
SELECT COUNT(*) FROM "Currency";                -- Should be 4
SELECT COUNT(*) FROM "PriceDaily";              -- Should be ~3,960 (11 coins × 4 currencies × 90 days)
SELECT COUNT(*) FROM "PriceHourly";             -- Should be ~95,040 (11 × 4 × 90 × 24)

# Sample data
SELECT c.name, cu.code, pd.date, pd.price
FROM "PriceDaily" pd
JOIN "Coin" c ON pd."coinId" = c.id
JOIN "Currency" cu ON pd."currencyCode" = cu.code
ORDER BY pd.date DESC, c.name
LIMIT 20;

# Exit
\q
```

---

### 3. Monitor Logs

**Watch application logs:**

```bash
# In terminal where npm run dev is running, you'll see:
# ✓ Cron job triggered - starting data fetch
# ✓ Cleaning existing price data...
# ✓ Initializing coins and currencies...
# ✓ Starting historical price data fetch...
# ✓ Fetching Bitcoin prices for usd...
# ✓ Fetching Bitcoin prices for try...
# ... (44 total fetches)
# ✓ Storing 3960 daily prices and 95040 hourly prices
# ✓ Cron job completed successfully
```

---

### 4. Test Health Check Endpoint

```bash
curl -X GET http://localhost:3000/api/cron/fetch-data \
  -H "Authorization: Bearer dev-secret-for-local-testing-only"
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "endpoint": "/api/cron/fetch-data",
    "method": "POST",
    "description": "Scheduled data fetch endpoint for CoinGecko API"
  }
}
```

---

## 🎯 Production Testing

### Before EventBridge Setup

**Test production endpoint manually:**

```bash
curl -X POST https://your-domain.com/api/cron/fetch-data \
  -H "Authorization: Bearer YOUR_PRODUCTION_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Verify in CloudWatch Logs:**

1. Go to CloudWatch → Log groups
2. Find `/ecs/crypto-dashboard`
3. Look for log streams with recent activity
4. Search for "Cron job" to see execution logs

---

### After EventBridge Setup

**Check EventBridge invocations:**

```bash
aws events list-rule-names-by-target \
  --target-arn arn:aws:events:us-east-1:YOUR_ACCOUNT:destination/crypto-dashboard-api

# View recent invocations
aws events list-rule-names-by-target \
  --target-arn YOUR_TARGET_ARN \
  --query 'RuleNames' \
  --output table
```

**Check CloudWatch metrics:**

```bash
# Successful invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Events \
  --metric-name Invocations \
  --dimensions Name=RuleName,Value=crypto-dashboard-daily-fetch \
  --start-time 2025-10-17T00:00:00Z \
  --end-time 2025-10-18T23:59:59Z \
  --period 3600 \
  --statistics Sum

# Failed invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Events \
  --metric-name FailedInvocations \
  --dimensions Name=RuleName,Value=crypto-dashboard-daily-fetch \
  --start-time 2025-10-17T00:00:00Z \
  --end-time 2025-10-18T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## 🐛 Troubleshooting

### Issue: "CRON_SECRET environment variable not configured"

**Cause:** Missing environment variable

**Fix:**

```bash
# Local (.env)
echo 'CRON_SECRET="dev-secret-for-local-testing-only"' >> .env

# Production (AWS Secrets Manager)
aws secretsmanager create-secret \
  --name crypto-dashboard/cron-secret \
  --secret-string "$(openssl rand -base64 32)"
```

---

### Issue: Request times out after 29 seconds

**Cause:** API Gateway has 29-second timeout, data fetch takes ~2-3 minutes

**Solutions:**

**Option A: Return immediately, process in background**

```typescript
// In route.ts
export async function POST(request: NextRequest) {
  // ... auth ...

  // Fire and forget (non-blocking)
  dataFetcherService.runFullDataFetch(false).catch((error) => {
    logger.error("Background fetch failed", error);
  });

  // Return immediately
  return ApiResponse.success({
    message: "Data fetch started in background",
    timestamp: new Date().toISOString(),
  });
}
```

**Option B: Use AWS Lambda with extended timeout**

- Lambda allows up to 15 minutes
- EventBridge → Lambda → Call dataFetcherService

---

### Issue: Rate limiting (429) from CoinGecko

**Cause:** Too many requests too quickly

**Current protection:**

```typescript
// Already implemented in coingecko.service.ts
const RATE_LIMIT_DELAY = 2000; // 2 seconds = 30 req/min
```

**If still hitting limits:**

```typescript
// Increase delay
const RATE_LIMIT_DELAY = 3000; // 3 seconds = 20 req/min (safer)
```

---

### Issue: Database connection timeout

**Cause:** Too many concurrent connections

**Fix in prisma/schema.prisma:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  connection_limit = 10
  pool_timeout = 60
}
```

**Or in DATABASE_URL:**

```bash
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=60
```

---

## 📊 Expected Results

### Timeline for Full Data Fetch

```
0:00 - Authentication ✓
0:01 - Clean existing data ✓
0:02 - Initialize coins & currencies ✓
0:03 - Start fetching from CoinGecko...
0:05 - Fetched 5/44 coin-currency pairs
0:10 - Fetched 10/44 pairs
...
1:30 - Fetched 44/44 pairs ✓
1:35 - Processing and storing data...
1:50 - Stored all daily prices ✓
2:10 - Stored all hourly prices ✓
2:15 - Complete! ✓
```

### Data Volume

```
Coins: 11
Currencies: 4
Date Range: 90 days
Time Points: Hourly (24 per day)

Daily Records: 11 × 4 × 90 = 3,960
Hourly Records: 11 × 4 × 90 × 24 = 95,040
Total Records: ~99,000

Database Size: ~15-20 MB
```

---

## ✅ Success Checklist

- [ ] Cron endpoint returns 200 with correct secret
- [ ] Cron endpoint returns 401 with wrong secret
- [ ] Database has 11 coins
- [ ] Database has 4 currencies
- [ ] Database has ~3,960 daily price records
- [ ] Database has ~95,040 hourly price records
- [ ] No errors in application logs
- [ ] CoinGecko API rate limits respected (no 429 errors)
- [ ] EventBridge rule created (production)
- [ ] EventBridge test invocation successful (production)
- [ ] CloudWatch alarms configured (production)

---

## 🎓 Interview Questions & Answers

**Q: Why use a cron endpoint instead of a background worker?**

A: "The cron endpoint approach is more scalable and cloud-native. It works with serverless architectures (Lambda, ECS Fargate), doesn't require a persistent worker process, and integrates naturally with AWS EventBridge for scheduling. It's also easier to test and monitor."

**Q: How do you prevent duplicate data?**

A: "The data fetcher uses `cleanFirst: false` in production, which means it uses upsert operations. Prisma handles deduplication based on unique constraints (coinId + currencyCode + date/timestamp). This prevents duplicates even if the cron runs multiple times."

**Q: What if the cron job fails?**

A: "EventBridge has built-in retry logic with exponential backoff. We also have a Dead Letter Queue (DLQ) to capture failed events for investigation. CloudWatch alarms notify the ops team immediately on failures."

**Q: How do you handle rate limiting?**

A: "We implement a 2-second delay between API requests (30 req/min), which is conservative for CoinGecko's 30-50 req/min limit. We also have exponential backoff retry logic for 429 responses, and log all rate limiting incidents for monitoring."

**Q: Could this scale to 1000 coins?**

A: "Yes, but we'd need optimizations:

1. Batch requests where possible
2. Use CoinGecko's bulk endpoints if available
3. Distribute fetching across multiple workers
4. Consider caching frequently accessed data
5. Implement a queue system (SQS) for processing
6. Potentially upgrade to CoinGecko Pro for higher rate limits"
