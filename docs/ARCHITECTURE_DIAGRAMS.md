# System Architecture - Visual Reference

## 🏗️ Complete System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AWS CLOUD (PRODUCTION)                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    AWS EventBridge                            │   │
│  │  ┌────────────────────────────────────────────────┐          │   │
│  │  │  Schedule: cron(0 2 * * ? *)                   │          │   │
│  │  │  Description: Daily at 2 AM UTC                │          │   │
│  │  │  Target: crypto-dashboard API destination      │          │   │
│  │  └────────────────┬───────────────────────────────┘          │   │
│  └───────────────────┼──────────────────────────────────────────┘   │
│                      │                                               │
│                      │ POST /api/cron/fetch-data                     │
│                      │ Authorization: Bearer <CRON_SECRET>           │
│                      ↓                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                CloudFront Distribution                        │   │
│  │  - Global edge locations (200+)                              │   │
│  │  - SSL/TLS termination                                       │   │
│  │  - Static asset caching (1 year)                            │   │
│  │  - API response caching (5 minutes)                         │   │
│  └────────────────────┬─────────────────────────────────────────┘   │
│                       │                                              │
│                       ↓                                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Application Load Balancer (ALB)                     │   │
│  │  - Health checks (/api/health)                               │   │
│  │  - SSL certificate (ACM)                                     │   │
│  │  - HTTP → HTTPS redirect                                     │   │
│  │  - Request routing to ECS                                    │   │
│  └────────────────────┬─────────────────────────────────────────┘   │
│                       │                                              │
│         ┌─────────────┴─────────────┐                               │
│         ↓                           ↓                               │
│  ┌─────────────┐             ┌─────────────┐                        │
│  │  ECS Task 1 │             │  ECS Task 2 │                        │
│  │  (Fargate)  │             │  (Fargate)  │                        │
│  │             │             │             │                        │
│  │  Next.js    │             │  Next.js    │                        │
│  │  Container  │             │  Container  │                        │
│  │  Port: 3000 │             │  Port: 3000 │                        │
│  │             │             │             │                        │
│  │  0.5 vCPU   │             │  0.5 vCPU   │                        │
│  │  1 GB RAM   │             │  1 GB RAM   │                        │
│  └──────┬──────┘             └──────┬──────┘                        │
│         │                           │                               │
│         └───────────┬───────────────┘                               │
│                     ↓                                               │
│         ┌─────────────────────────┐                                 │
│         │   RDS PostgreSQL 18     │                                 │
│         │   (Multi-AZ)            │                                 │
│         │                         │                                 │
│         │  - Auto backups (7d)    │                                 │
│         │  - Snapshots (manual)   │                                 │
│         │  - Read replicas (opt)  │                                 │
│         │  - Encryption at rest   │                                 │
│         │                         │                                 │
│         │  Instance: db.t3.micro  │                                 │
│         │  Storage: 20 GB SSD     │                                 │
│         └─────────────────────────┘                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AWS Secrets Manager                         │  │
│  │  - crypto-dashboard/database-url                             │  │
│  │  - crypto-dashboard/coingecko-api-key                        │  │
│  │  - crypto-dashboard/cron-secret                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CloudWatch (Monitoring & Logs)                   │  │
│  │  - ECS task logs                                             │  │
│  │  - RDS performance metrics                                   │  │
│  │  - ALB request/response logs                                 │  │
│  │  - EventBridge invocation logs                               │  │
│  │  - Custom application logs                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    CoinGecko API                              │    │
│  │  https://api.coingecko.com/api/v3                            │    │
│  │                                                               │    │
│  │  Endpoints Used:                                             │    │
│  │  1. GET /coins/list                                          │    │
│  │  2. GET /coins/{id}/market_chart/range                       │    │
│  │  3. GET /coins/{id}  (bonus feature)                         │    │
│  │                                                               │    │
│  │  Rate Limit: 30-50 req/min (Free Tier)                      │    │
│  │  Our Usage: 30 req/min (2s delay)                           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Scheduled Data Fetch Flow

```
┌─────────────┐
│ EventBridge │  Every day at 2 AM UTC
│   Rule      │
└──────┬──────┘
       │
       │ 1. Trigger event
       ↓
┌──────────────────────┐
│  API Destination     │  POST /api/cron/fetch-data
│  (CloudFront/ALB)    │  Header: Authorization: Bearer <secret>
└──────┬───────────────┘
       │
       │ 2. Route to container
       ↓
┌──────────────────────┐
│  ECS Task            │  /api/cron/fetch-data/route.ts
│  (Next.js)           │
└──────┬───────────────┘
       │
       │ 3. Validate CRON_SECRET
       ↓
┌──────────────────────┐
│  dataFetcherService  │  runFullDataFetch(cleanFirst: false)
└──────┬───────────────┘
       │
       │ 4. Initialize coins & currencies
       ↓
┌──────────────────────┐
│  coinGeckoService    │  batchFetchMarketData()
└──────┬───────────────┘
       │
       │ 5. For each coin × currency (44 total):
       │    - Wait 2 seconds (rate limiting)
       │    - GET /coins/{id}/market_chart/range
       │    - Parse response
       ↓
┌──────────────────────┐
│  CoinGecko API       │  Returns hourly price data
└──────┬───────────────┘
       │
       │ 6. Return price arrays
       ↓
┌──────────────────────┐
│  dataFetcherService  │  processAndStoreData()
└──────┬───────────────┘
       │
       │ 7. Transform data:
       │    - Group hourly → daily averages
       │    - Create DTOs
       │    - Batch in groups of 500
       ↓
┌──────────────────────┐
│  priceRepository     │  createManyDaily(), createManyHourly()
└──────┬───────────────┘
       │
       │ 8. Batch insert (500 records/batch)
       ↓
┌──────────────────────┐
│  PostgreSQL (RDS)    │  ~99,000 records stored
└──────────────────────┘
       │
       │ 9. Return success
       ↓
┌──────────────────────┐
│  EventBridge         │  Log success metrics to CloudWatch
└──────────────────────┘

Total Duration: ~2-3 minutes
  - API calls: ~88 seconds (44 × 2s)
  - Processing: ~30 seconds
  - Database: ~60 seconds
```

---

### 2. User Request Flow

```
┌─────────────┐
│   Browser   │  User visits dashboard
└──────┬──────┘
       │
       │ 1. HTTPS request
       ↓
┌──────────────────────┐
│  CloudFront Edge     │  Nearest edge location (e.g., Frankfurt)
│  Location            │
└──────┬───────────────┘
       │
       │ 2. Cache check:
       │    - HIT: Return cached response
       │    - MISS: Forward to origin
       ↓
┌──────────────────────┐
│  CloudFront Origin   │  Forward to ALB
└──────┬───────────────┘
       │
       │ 3. SSL/TLS decryption
       ↓
┌──────────────────────┐
│  ALB                 │  Health check passed? Route to healthy target
└──────┬───────────────┘
       │
       │ 4. Load balance across tasks
       ↓
┌──────────────────────┐
│  ECS Task (1 or 2)   │  Next.js handles request
└──────┬───────────────┘
       │
       │ 5. Route to API endpoint
       ↓
┌──────────────────────┐
│  /api/coins/route.ts │  coinService.findAll()
└──────┬───────────────┘
       │
       │ 6. Call service
       ↓
┌──────────────────────┐
│  coinService         │  Orchestrate business logic
└──────┬───────────────┘
       │
       │ 7. Query database
       ↓
┌──────────────────────┐
│  coinRepository      │  prisma.coin.findMany()
└──────┬───────────────┘
       │
       │ 8. Execute query
       ↓
┌──────────────────────┐
│  PostgreSQL          │  Return 11 coins
└──────┬───────────────┘
       │
       │ 9. Map to DTO
       ↓
┌──────────────────────┐
│  coinService         │  Transform to API response
└──────┬───────────────┘
       │
       │ 10. Return JSON
       ↓
┌──────────────────────┐
│  Next.js             │  ApiResponse.success(coins)
└──────┬───────────────┘
       │
       │ 11. Send response
       ↓
┌──────────────────────┐
│  ALB                 │  Forward response
└──────┬───────────────┘
       │
       │ 12. Cache at edge
       ↓
┌──────────────────────┐
│  CloudFront          │  Cache for 5 minutes
└──────┬───────────────┘
       │
       │ 13. Deliver to user
       ↓
┌──────────────────────┐
│  Browser             │  Render UI
└──────────────────────┘

First Request: ~200-500ms
Cached Request: ~10-50ms
```

---

## 📦 Container Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Docker Image Layers                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Layer 1: Base (node:20-alpine)                      │ │
│  │  - Alpine Linux (5 MB)                               │ │
│  │  - Node.js 20 runtime                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Layer 2: Dependencies                               │ │
│  │  - package.json + package-lock.json                  │ │
│  │  - npm ci (production dependencies only)             │ │
│  │  - ~150 MB                                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Layer 3: Build                                      │ │
│  │  - Application source code                           │ │
│  │  - npx prisma generate                              │ │
│  │  - npm run build (Next.js)                          │ │
│  │  - Optimized production bundles                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Layer 4: Runtime                                    │ │
│  │  - Standalone Next.js server                        │ │
│  │  - Static assets (.next/static)                     │ │
│  │  - Prisma client (generated)                        │ │
│  │  - Non-root user (nextjs:1001)                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Total Size: ~200 MB (vs ~1 GB without optimization)       │
└────────────────────────────────────────────────────────────┘

Running Container:
┌────────────────────────────────────────┐
│  Process Tree:                         │
│                                        │
│  PID 1: node server.js                │
│    ├─ Next.js Router                  │
│    ├─ API Route Handlers              │
│    ├─ Prisma Client                   │
│    └─ Connection Pool (max 10)        │
│                                        │
│  Ports:                                │
│    3000 → HTTP (internal)             │
│                                        │
│  Resources:                            │
│    CPU: 0.5 vCPU                      │
│    Memory: 1 GB                       │
│    Disk: Ephemeral (container only)   │
└────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 18 (RDS Multi-AZ)                 │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Primary Instance (Availability Zone A)                  │ │
│  │                                                           │ │
│  │  Tables:                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   Coin      │  │  Currency   │  │ PriceDaily  │    │ │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤    │ │
│  │  │ id (PK)     │  │ code (PK)   │  │ id (PK)     │    │ │
│  │  │ symbol      │  │ name        │  │ coinId (FK) │    │ │
│  │  │ name        │  │ createdAt   │  │ currency (FK│    │ │
│  │  │ createdAt   │  │ updatedAt   │  │ date        │    │ │
│  │  │ updatedAt   │  └─────────────┘  │ price       │    │ │
│  │  └─────────────┘                   │ createdAt   │    │ │
│  │                                     │ updatedAt   │    │ │
│  │  ┌─────────────┐  ┌─────────────┐  └─────────────┘    │ │
│  │  │PriceHourly  │  │CoinMetadata │                      │ │
│  │  ├─────────────┤  ├─────────────┤  Indexes:            │ │
│  │  │ id (PK)     │  │ coinId (PK) │  - coinId            │ │
│  │  │ coinId (FK) │  │ description │  - currencyCode      │ │
│  │  │ currency (FK│  │ imageUrl    │  - date/timestamp    │ │
│  │  │ timestamp   │  │ websiteUrl  │  - compound indexes  │ │
│  │  │ price       │  │ createdAt   │                      │ │
│  │  │ createdAt   │  │ updatedAt   │  Constraints:        │ │
│  │  │ updatedAt   │  └─────────────┘  - UNIQUE           │ │
│  │  └─────────────┘                   - FOREIGN KEY       │ │
│  │                                     - NOT NULL          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓ Synchronous replication         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Standby Instance (Availability Zone B)                  │ │
│  │  - Automatic failover (<60 seconds)                     │ │
│  │  - Always in sync                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Automated Backups                                       │ │
│  │  - Daily snapshots (7-day retention)                    │ │
│  │  - Transaction logs (Point-in-time recovery)           │ │
│  │  - Manual snapshots (kept indefinitely)                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Connection Flow:
┌────────────┐       ┌────────────┐       ┌────────────┐
│  ECS Task  │──────▶│  Prisma    │──────▶│ PostgreSQL │
│            │       │  Client    │       │   Primary  │
│  Pool: 10  │       │  Pool: 10  │       │            │
└────────────┘       └────────────┘       └────────────┘
                                                  │
                                                  │ Failover
                                                  ↓
                                          ┌────────────┐
                                          │ PostgreSQL │
                                          │  Standby   │
                                          └────────────┘
```

---

## 🔒 Security Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Security Layers                          │
│                                                                │
│  Layer 1: Network Security                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  - VPC isolation (private subnets for RDS)              │ │
│  │  - Security groups (least privilege)                    │ │
│  │  - NACLs (network-level firewall)                       │ │
│  │  - WAF rules (OWASP Top 10 protection)                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Layer 2: Transport Security                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  - TLS 1.3 (CloudFront + ALB)                          │ │
│  │  - ACM certificates (auto-renewal)                      │ │
│  │  - HTTPS-only (HTTP → HTTPS redirect)                   │ │
│  │  - Encrypted database connections                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Layer 3: Application Security                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  - Bearer token auth (CRON_SECRET)                      │ │
│  │  - Request validation (Zod schemas)                     │ │
│  │  - Rate limiting (API + CoinGecko)                      │ │
│  │  - Error masking (no sensitive data in responses)       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Layer 4: Data Security                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  - Encryption at rest (RDS KMS)                         │ │
│  │  - Secrets Manager (credentials)                        │ │
│  │  - Parameterized queries (SQL injection prevention)     │ │
│  │  - Automated backups (disaster recovery)                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Layer 5: Monitoring & Auditing                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  - CloudWatch logs (all requests)                       │ │
│  │  - Unauthorized access alerts                           │ │
│  │  - Failed authentication logging                        │ │
│  │  - Anomaly detection (CloudWatch Insights)              │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

**Print this for visual reference during your interview!** 📊
