# 🎯 Interview Cheat Sheet - Quick Reference

## Core Architecture (30 seconds)

```
Next.js Full-Stack App
    ↓
Backend: API Routes + Prisma ORM
    ↓
Database: PostgreSQL 18 (Docker)
    ↓
External API: CoinGecko (rate-limited)
    ↓
Scheduling: AWS EventBridge → Cron Endpoint
```

---

## Tech Stack (Memorize This)

| Layer          | Technology                      | Why?                                   |
| -------------- | ------------------------------- | -------------------------------------- |
| **Frontend**   | Next.js 15 + React + TypeScript | Full-stack in one repo, built-in SSR   |
| **Backend**    | Next.js API Routes              | No separate Express needed             |
| **ORM**        | Prisma 6                        | Type-safe queries, auto-migrations     |
| **Database**   | PostgreSQL 18                   | Best for time-series & relational data |
| **API**        | CoinGecko Free Tier             | 30 req/min, 365-day history            |
| **Deployment** | AWS ECS Fargate                 | Serverless containers, auto-scaling    |
| **Scheduling** | AWS EventBridge                 | Managed cron, no EC2 needed            |
| **CDN**        | CloudFront                      | Global edge caching                    |

---

## Data Flow (Explain in Interview)

### 1. Scheduled Data Fetch

```
EventBridge (daily 2 AM)
  → POST /api/cron/fetch-data (with Bearer token)
    → dataFetcherService.runFullDataFetch()
      → CoinGecko API (44 requests with 2s delays)
        → Process & Transform
          → PostgreSQL (batch insert 500/batch)
```

### 2. User Request

```
Browser
  → CloudFront (CDN)
    → ALB (Load Balancer)
      → ECS Container (Next.js)
        → Prisma Query
          → PostgreSQL
```

---

## Database Schema (5 Tables)

```sql
Coin (11 records)
  - id (PK): "bitcoin"
  - symbol: "btc"
  - name: "Bitcoin"

Currency (4 records)
  - code (PK): "usd"
  - name: "US Dollar"

PriceDaily (~3,960 records)
  - id (PK): UUID
  - coinId (FK)
  - currencyCode (FK)
  - date
  - price
  - UNIQUE(coinId, currencyCode, date)

PriceHourly (~95,040 records)
  - id (PK): UUID
  - coinId (FK)
  - currencyCode (FK)
  - timestamp
  - price
  - UNIQUE(coinId, currencyCode, timestamp)

CoinMetadata (bonus feature)
  - coinId (PK, FK)
  - description
  - imageUrl
  - websiteUrl
```

---

## Key Numbers (Memorize)

- **Coins**: 11 major cryptocurrencies
- **Currencies**: 4 (USD, EUR, GBP, TRY)
- **Date Range**: Last 90 days (dynamic)
- **API Calls**: 44 total (11 coins × 4 currencies)
- **Rate Limit**: 2 seconds between requests (30/min safe)
- **Daily Records**: ~3,960 (11 × 4 × 90)
- **Hourly Records**: ~95,040 (11 × 4 × 90 × 24)
- **Fetch Duration**: ~2-3 minutes (88s API + processing)
- **Database Size**: ~15-20 MB

---

## Security Implementation

### Cron Endpoint Protection

```typescript
// 1. Environment variable (AWS Secrets Manager)
CRON_SECRET = "random-32-byte-string";

// 2. Bearer token validation
Authorization: Bearer<CRON_SECRET>;

// 3. Logging
logger.warn("Unauthorized attempt", { ip, providedSecret });
```

### Production Secrets

- DATABASE_URL → AWS Secrets Manager
- COINGECKO_API_KEY → AWS Secrets Manager
- CRON_SECRET → AWS Secrets Manager

---

## Modular Architecture (NestJS-style)

```
src/lib/modules/
├── coin/
│   ├── coin.types.ts        # TypeScript interfaces
│   ├── coin.repository.ts   # Database operations
│   └── coin.service.ts      # Business logic
├── currency/
├── price/
├── coingecko/
│   ├── coingecko.types.ts   # API response types
│   └── coingecko.service.ts # API client (singleton)
└── data-fetcher/
    └── data-fetcher.service.ts  # Orchestration
```

**Benefits:**

- Clear separation of concerns
- Easy to test (mock repositories)
- Scalable (add modules independently)
- SOLID principles

---

## Rate Limiting Strategy

```typescript
// Why 2 seconds?
const RATE_LIMIT_DELAY = 2000; // milliseconds

// Math:
// 2 seconds per request = 30 requests/minute
// CoinGecko free tier: 30-50 req/min
// 2s gives us safe margin + retries
```

**Implementation:**

```typescript
for (const coinId of coinIds) {
  await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
  await fetchCoin(coinId);
}
```

---

## AWS Architecture

```
┌─────────────┐
│ CloudFront  │ → Global CDN, SSL, caching
└──────┬──────┘
       ↓
┌─────────────┐
│     ALB     │ → Health checks, SSL cert
└──────┬──────┘
       ↓
┌─────────────┐
│  ECS (×2)   │ → Auto-scaling containers
└──────┬──────┘
       ↓
┌─────────────┐
│ RDS (Multi) │ → PostgreSQL, auto-backups
└─────────────┘

┌─────────────┐
│ EventBridge │ → Scheduled triggers
└─────────────┘
```

---

## Costs (Monthly)

| Service               | Cost             |
| --------------------- | ---------------- |
| ECS Fargate (2 tasks) | ~$30             |
| RDS PostgreSQL        | ~$15             |
| ALB                   | ~$20             |
| CloudFront (1TB)      | ~$85             |
| **TOTAL**             | **~$150-200/mo** |

**Free Tier**: First year gets RDS + some ECS free

---

## Common Interview Questions

### Q: Why Next.js over separate backend?

**A**: "Unified full-stack framework eliminates backend boilerplate. Built-in API routes, SSR, and deployment optimization. Single TypeScript codebase reduces context switching."

### Q: How does cron work without a server?

**A**: "AWS EventBridge is a managed cron service. It triggers our API endpoint with a POST request. The endpoint validates auth, fetches data, and returns. No persistent worker needed - serverless and scalable."

### Q: What if CoinGecko rate limits you?

**A**: "Three defenses:

1. Conservative 2s delay (vs their 2s minimum)
2. Exponential backoff on 429 errors
3. Retry logic with max 3 attempts
4. Monitoring + alerts on failures"

### Q: How do you prevent duplicate data?

**A**: "Database-level UNIQUE constraints on (coinId, currencyCode, date/timestamp). Prisma uses upsert operations. Safe to run cron multiple times."

### Q: Scale to 10,000 coins?

**A**: "Need architectural changes:

1. Queue system (SQS) for parallel processing
2. Multiple workers for concurrent fetches
3. CoinGecko Pro for bulk endpoints
4. Read replicas for query distribution
5. Caching layer (Redis) for hot data
6. Time-series DB (TimescaleDB) for better performance"

### Q: Why PostgreSQL over MongoDB?

**A**: "Time-series price data is inherently relational. Need JOIN queries (coins × currencies × prices). PostgreSQL excels at:

- Complex queries with proper indexing
- Data integrity with foreign keys
- ACID transactions for consistency
- Better query optimization for time-series"

### Q: Disaster recovery plan?

**A**: "Multi-layer backup:

1. RDS automated backups (7-day retention)
2. RDS snapshots (manual, kept indefinitely)
3. Multi-AZ deployment (instant failover)
4. Point-in-time recovery
5. CloudWatch alarms for anomalies
6. DLQ for failed events"

---

## Docker Configuration

```dockerfile
# Multi-stage build (optimized size)
FROM node:20-alpine AS base
FROM base AS deps      # Install dependencies
FROM base AS builder   # Build Next.js + Prisma
FROM base AS runner    # Minimal runtime image

# Result: ~200MB vs ~1GB (80% smaller)
```

---

## Performance Optimizations

1. **Database Indexing**

   ```sql
   INDEX on (coinId, currencyCode, date)
   INDEX on (coinId, currencyCode, timestamp)
   ```

2. **Batch Inserts**

   ```typescript
   // 500 records per batch vs 1-by-1
   await prisma.priceDaily.createMany({ data: batch });
   ```

3. **Connection Pooling**

   ```prisma
   datasource db {
     connection_limit = 10
   }
   ```

4. **CDN Caching**
   - Static assets: 1 year
   - API responses: 5 minutes

---

## Testing Strategy

```bash
# Local
curl http://localhost:3000/api/health
curl http://localhost:3000/api/cron/fetch-data \
  -H "Authorization: Bearer dev-secret"

# Production
curl https://your-domain.com/api/health
aws cloudwatch get-metric-statistics ...
```

---

## Monitoring Checklist

- [ ] CloudWatch Dashboard (CPU, Memory, Requests)
- [ ] Alarms (5xx errors, high CPU, DB connections)
- [ ] SNS notifications to ops team
- [ ] Application logs in CloudWatch
- [ ] EventBridge invocation metrics
- [ ] Dead Letter Queue for failed events

---

## Quick Commands

```bash
# Local Dev
npm run dev
npm run studio
npm run fetch-data

# Database
docker-compose up -d
npx prisma migrate dev
npx prisma studio

# Production
aws ecr get-login-password | docker login ...
docker build -t crypto-dashboard .
docker push ...
aws ecs update-service --force-new-deployment
```

---

## File Structure (What to Show)

```
src/lib/modules/
├── coingecko/coingecko.service.ts   # "Here's API integration"
├── price/price.service.ts           # "Here's business logic"
├── data-fetcher/data-fetcher.service.ts  # "Here's orchestration"

docs/
├── SCHEDULED_FETCHING.md            # "Here's cron setup"
├── AWS_DEPLOYMENT.md                # "Here's production guide"

prisma/schema.prisma                 # "Here's database schema"
```

---

## One-Liner Explanations

**Project**: "Full-stack crypto dashboard with scheduled data fetching, built on Next.js + PostgreSQL, deployed on AWS with serverless cron jobs."

**Architecture**: "Modular NestJS-style structure with services and repositories, type-safe Prisma ORM, and AWS EventBridge for scheduling."

**Scaling**: "Current: handles 11 coins smoothly. To scale: add SQS queue, multiple workers, read replicas, and caching layer."

**Security**: "Secrets in AWS Secrets Manager, cron endpoint with bearer auth, rate limiting, and comprehensive monitoring."

**Timeline**: "Built in 5 days: Day 1-2 backend, Day 3 data pipeline, Day 4 docs, Day 5 deployment prep."

---

## Print This & Keep Nearby During Interview! 🎯
