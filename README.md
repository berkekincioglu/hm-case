# Cryptocurrency Price Dashboard - Case Study Implementation

> A full-stack cryptocurrency price tracking dashboard built with Next.js, TypeScript, and PostgreSQL, consuming data from the CoinGecko API.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Assessment](#technology-assessment)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Endpoints Design](#api-endpoints-design)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Development Setup](#development-setup)
8. [Deployment Strategy](#deployment-strategy)

---

## 🎯 Project Overview

### Case Study Requirements Summary

**Goal**: Build a cryptocurrency price dashboard with:

- Historical price data visualization (charts & tables)
- Multi-dimensional filtering (Coin, Currency, Date)
- Automatic granularity switching (daily vs hourly)
- Backend-only CoinGecko API integration
- Scheduled data fetching and storage
- Login authentication (hardcoded credentials)

**Key Features**:

- 📊 Interactive chart with range selection
- 📈 Dynamic table with sorting, reordering, and pagination
- 🔄 Auto-switching between daily/hourly views
- 🎛️ Multi-dimensional breakdown capabilities
- 🔐 Simple authentication layer

---

## ✅ Technology Assessment

### Why Next.js is Perfect for This Project

| Requirement                | Next.js Solution                     | ✓   |
| -------------------------- | ------------------------------------ | --- |
| **Backend API**            | API Routes (`/app/api/*`)            | ✅  |
| **Frontend**               | Built-in React + TypeScript          | ✅  |
| **Scheduled Tasks**        | API route + External cron service    | ✅  |
| **Database Integration**   | Native support for PostgreSQL/SQLite | ✅  |
| **Authentication**         | Middleware + Session management      | ✅  |
| **Deployment**             | AWS Lambda + CloudFront via CDK      | ✅  |
| **Full-stack in one repo** | Unified codebase                     | ✅  |

**Verdict**: ✅ **Next.js is highly suitable for both frontend and backend needs.**

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login Page  │  │  Dashboard   │  │   Filters    │      │
│  │              │  │  - Chart     │  │  - Coin      │      │
│  │              │  │  - Table     │  │  - Currency  │      │
│  │              │  │              │  │  - Date      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           ↓                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP Requests
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth    │  │ /api/coins   │  │ /api/prices  │      │
│  │              │  │              │  │              │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ /api/fetch   │  │/api/currencies│ │ /api/metadata│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           ↓                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ↓                               ↓
┌─────────────────────┐         ┌─────────────────────┐
│   DATABASE          │         │   COINGECKO API     │
│   (PostgreSQL)      │         │   (External)        │
│                     │         │                     │
│  - coins            │         │  Used only by       │
│  - currencies       │         │  backend scheduler  │
│  - prices_daily     │         │                     │
│  - prices_hourly    │         └─────────────────────┘
│  - coin_metadata    │
└─────────────────────┘
```

### Component Breakdown

#### Backend Components

1. **API Routes** (`/app/api/`)

   - Authentication endpoints
   - Data retrieval endpoints
   - Scheduled data fetcher endpoint

2. **Services Layer** (`/src/lib/services/`)

   - CoinGecko API client
   - Database query service
   - Data aggregation service

3. **Database Layer** (`/src/lib/db/`)
   - Connection management
   - Query builders
   - Migrations

#### Frontend Components

1. **Pages** (`/app/`)

   - Login page
   - Dashboard page

2. **Components** (`/src/components/`)

   - Chart component (with range selection)
   - Table component (sortable, reorderable, paginated)
   - Filter controls
   - Tooltip (bonus feature)

3. **State Management** (`/src/hooks/`, `/src/context/`)
   - Filter state
   - Data fetching hooks
   - Authentication context

---

## 🗄️ Database Design

### Schema Overview

#### Table: `coins`

```sql
CREATE TABLE coins (
  id VARCHAR(50) PRIMARY KEY,           -- e.g., 'bitcoin'
  symbol VARCHAR(10) NOT NULL,          -- e.g., 'BTC'
  name VARCHAR(100) NOT NULL,           -- e.g., 'Bitcoin'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `currencies`

```sql
CREATE TABLE currencies (
  code VARCHAR(10) PRIMARY KEY,         -- e.g., 'USD'
  name VARCHAR(50) NOT NULL,            -- e.g., 'US Dollar'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `prices_daily`

```sql
CREATE TABLE prices_daily (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(50) REFERENCES coins(id),
  currency_code VARCHAR(10) REFERENCES currencies(code),
  date DATE NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coin_id, currency_code, date)
);

CREATE INDEX idx_prices_daily_lookup ON prices_daily(coin_id, currency_code, date);
CREATE INDEX idx_prices_daily_date ON prices_daily(date);
```

#### Table: `prices_hourly`

```sql
CREATE TABLE prices_hourly (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(50) REFERENCES coins(id),
  currency_code VARCHAR(10) REFERENCES currencies(code),
  timestamp TIMESTAMP NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coin_id, currency_code, timestamp)
);

CREATE INDEX idx_prices_hourly_lookup ON prices_hourly(coin_id, currency_code, timestamp);
CREATE INDEX idx_prices_hourly_timestamp ON prices_hourly(timestamp);
```

#### Table: `coin_metadata` (Bonus Feature)

```sql
CREATE TABLE coin_metadata (
  coin_id VARCHAR(50) PRIMARY KEY REFERENCES coins(id),
  description TEXT,
  image_url VARCHAR(500),
  homepage_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints Design

### Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
```

### Data Fetching

```
GET    /api/coins
       Response: [{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }]

GET    /api/currencies
       Response: [{ code: 'USD', name: 'US Dollar' }]

GET    /api/prices
       Query Params:
         - coins: string[] (e.g., 'bitcoin,ethereum')
         - currencies: string[] (e.g., 'usd,eur')
         - dateFrom: ISO date
         - dateTo: ISO date
         - breakdown: string[] (e.g., 'coin,currency,date')
         - granularity: 'daily' | 'hourly'
       Response: {
         data: [{
           coin?: string,
           currency?: string,
           date?: string,
           price: number
         }]
       }

GET    /api/metadata/:coinId (Bonus)
       Response: { coin_id, description, image_url, homepage_url }
```

### Background Tasks

```
POST   /api/fetch/trigger (Protected - internal use)
       Triggers data fetch from CoinGecko
```

---

## 🚀 Implementation Roadmap

### **PHASE 1: Backend Foundation** (Start Here - Priority 1)

#### Step 1.1: Database Setup

- [ ] Install PostgreSQL locally (or use Docker)
- [ ] Create database schema (tables and indexes)
- [ ] Set up database connection utility
- [ ] Create migration scripts

**Files to create**:

- `/src/lib/db/schema.sql`
- `/src/lib/db/connection.ts`
- `/src/lib/db/migrate.ts`

---

#### Step 1.2: CoinGecko Integration Service

- [ ] Create CoinGecko API client
- [ ] Implement coin list fetcher
- [ ] Implement historical price fetcher (market_chart/range)
- [ ] Add error handling and rate limiting
- [ ] Add retry logic

**Files to create**:

- `/src/lib/services/coingecko.ts`
- `/src/lib/types/coingecko.ts`

---

#### Step 1.3: Data Fetcher & Storage

- [ ] Create data fetcher service
- [ ] Fetch 10+ major coins (BTC, ETH, SOL, etc.)
- [ ] Fetch 4 currencies (USD, TRY, EUR, GBP)
- [ ] Process and store daily data (July-August 2025)
- [ ] Process and store hourly data (July-August 2025)
- [ ] Store coin metadata (bonus)

**Files to create**:

- `/src/lib/services/dataFetcher.ts`
- `/src/lib/services/dataStorage.ts`

---

#### Step 1.4: Data Query & Aggregation Service

- [ ] Create query builder for flexible filtering
- [ ] Implement breakdown logic (group by dimensions)
- [ ] Implement aggregation (average prices)
- [ ] Handle daily vs hourly switching
- [ ] Optimize queries with proper indexes

**Files to create**:

- `/src/lib/services/priceQuery.ts`
- `/src/lib/services/aggregation.ts`

---

#### Step 1.5: API Endpoints - Data

- [ ] `GET /api/coins` - List all coins
- [ ] `GET /api/currencies` - List all currencies
- [ ] `GET /api/prices` - Get filtered and aggregated prices
- [ ] `GET /api/metadata/:coinId` - Get coin metadata (bonus)
- [ ] Add input validation
- [ ] Add error handling

**Files to create**:

- `/app/api/coins/route.ts`
- `/app/api/currencies/route.ts`
- `/app/api/prices/route.ts`
- `/app/api/metadata/[coinId]/route.ts`

---

#### Step 1.6: Authentication API

- [ ] Create auth utility (JWT or session-based)
- [ ] Implement login endpoint (hardcoded credentials)
- [ ] Implement logout endpoint
- [ ] Implement session check endpoint
- [ ] Create auth middleware

**Files to create**:

- `/src/lib/auth/index.ts`
- `/app/api/auth/login/route.ts`
- `/app/api/auth/logout/route.ts`
- `/app/api/auth/session/route.ts`
- `/src/middleware.ts`

---

#### Step 1.7: Background Scheduler Setup

- [ ] Create trigger endpoint for data fetching
- [ ] Document how to set up external cron (GitHub Actions, AWS EventBridge)
- [ ] Test manual trigger
- [ ] Add logging

**Files to create**:

- `/app/api/fetch/trigger/route.ts`
- `/scripts/trigger-fetch.sh`

---

### **PHASE 2: Frontend Development** (Priority 2)

#### Step 2.1: Project Structure & UI Library Setup

- [ ] Install UI library (shadcn/ui, MUI, or Ant Design)
- [ ] Install charting library (Recharts, Chart.js, or Apache ECharts)
- [ ] Set up Tailwind CSS (if using shadcn)
- [ ] Create component structure
- [ ] Set up TypeScript types for API responses

**Files to create**:

- `/src/components/ui/*` (if using shadcn)
- `/src/types/api.ts`
- `/src/lib/utils.ts`

---

#### Step 2.2: Authentication Pages

- [ ] Create login page UI
- [ ] Implement login form with validation
- [ ] Handle authentication state
- [ ] Redirect logic after login
- [ ] Protected route middleware

**Files to create**:

- `/app/login/page.tsx`
- `/src/context/AuthContext.tsx`
- `/src/hooks/useAuth.ts`

---

#### Step 2.3: Dashboard Layout

- [ ] Create dashboard page structure
- [ ] Create filter panel component
- [ ] Implement multi-select coin dropdown
- [ ] Implement multi-select currency dropdown
- [ ] Implement date range picker
- [ ] Implement breakdown dimension selector

**Files to create**:

- `/app/dashboard/page.tsx`
- `/src/components/dashboard/FilterPanel.tsx`
- `/src/components/dashboard/CoinSelector.tsx`
- `/src/components/dashboard/CurrencySelector.tsx`
- `/src/components/dashboard/DateRangePicker.tsx`
- `/src/components/dashboard/BreakdownSelector.tsx`

---

#### Step 2.4: Chart Component

- [ ] Create chart component (line chart)
- [ ] Implement date as X-axis
- [ ] Implement price as Y-axis
- [ ] Display multiple lines for different breakdowns
- [ ] Implement range selection with mouse
- [ ] Auto-switch to hourly when range ≤ 2 days
- [ ] Add loading and error states

**Files to create**:

- `/src/components/dashboard/PriceChart.tsx`
- `/src/hooks/useChartData.ts`

---

#### Step 2.5: Table Component

- [ ] Create data table component
- [ ] Implement dynamic columns based on breakdown
- [ ] Implement sorting (click headers)
- [ ] Implement column reordering (drag & drop)
- [ ] Implement pagination
- [ ] Add loading and error states
- [ ] Handle empty data scenarios

**Files to create**:

- `/src/components/dashboard/PriceTable.tsx`
- `/src/hooks/useTableData.ts`

---

#### Step 2.6: Data Integration & State Management

- [ ] Create API client utilities (Axios/Fetch)
- [ ] Implement data fetching hooks
- [ ] Connect filters to API calls
- [ ] Sync chart and table data
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement debouncing for filter changes

**Files to create**:

- `/src/lib/api/client.ts`
- `/src/hooks/usePriceData.ts`
- `/src/hooks/useCoins.ts`
- `/src/hooks/useCurrencies.ts`

---

#### Step 2.7: Bonus Feature - Metadata Tooltip

- [ ] Create tooltip component
- [ ] Fetch metadata from API
- [ ] Display on hover over coin symbols
- [ ] Add caching to prevent repeated fetches

**Files to create**:

- `/src/components/dashboard/CoinTooltip.tsx`
- `/src/hooks/useCoinMetadata.ts`

---

#### Step 2.8: Polish & UX Improvements

- [ ] Add loading indicators
- [ ] Add error messages
- [ ] Improve responsive design
- [ ] Add animations/transitions
- [ ] Optimize performance
- [ ] Add proper TypeScript types everywhere

---

### **PHASE 3: Testing & Deployment** (Priority 3)

#### Step 3.1: Testing

- [ ] Test API endpoints (Postman/Thunder Client)
- [ ] Test frontend flows
- [ ] Test error scenarios
- [ ] Test edge cases (no data, invalid dates, etc.)
- [ ] Performance testing

---

#### Step 3.2: AWS Deployment (Bonus)

- [ ] Set up AWS CDK project
- [ ] Configure RDS PostgreSQL
- [ ] Configure Lambda for API routes
- [ ] Configure S3 + CloudFront for frontend
- [ ] Set up API Gateway
- [ ] Configure EventBridge for scheduled fetching
- [ ] Set up environment variables
- [ ] Configure IAM roles and policies

**Files to create**:

- `/infrastructure/lib/stack.ts`
- `/infrastructure/bin/app.ts`
- `/infrastructure/cdk.json`
- `/.env.production`

---

#### Step 3.3: Documentation

- [ ] Document API endpoints
- [ ] Document deployment steps
- [ ] Add environment setup guide
- [ ] Create demo credentials documentation
- [ ] Update README with deployment URL

---

## 🛠️ Development Setup

### Prerequisites

```bash
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- CoinGecko API Key
```

### Installation (Will be set up during implementation)

```bash
# Clone repository
git clone <repo-url>
cd hypermonk-case

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npm run db:migrate

# Run development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_dashboard

# CoinGecko
COINGECKO_API_KEY=your_api_key_here

# Auth
JWT_SECRET=your_secret_key_here

# Node
NODE_ENV=development
```

---

## 🚢 Deployment Strategy

### Option 1: Vercel (Simple)

- Frontend: Automatic deployment
- Backend: Serverless functions
- Database: External PostgreSQL (Neon, Supabase)

### Option 2: AWS (Bonus Points)

- Frontend: S3 + CloudFront
- Backend: Lambda + API Gateway
- Database: RDS PostgreSQL
- Scheduler: EventBridge
- IaC: AWS CDK (TypeScript)

---

## 📊 Success Criteria Checklist

### Database Design ✓

- [ ] Efficient schema supporting daily/hourly granularity
- [ ] Proper indexes for query performance
- [ ] Complex aggregation queries working correctly

### API Integration ✓

- [ ] CoinGecko integration only on backend
- [ ] Proper error handling
- [ ] No direct frontend access to CoinGecko

### Frontend UI/UX ✓

- [ ] Intuitive dashboard design
- [ ] Clear data visualization (chart + table)
- [ ] Smooth filtering and interaction

### State Management ✓

- [ ] Effective state handling
- [ ] Loading indicators
- [ ] Error states

### Error Handling ✓

- [ ] No data scenarios handled
- [ ] Invalid input handling
- [ ] Network failure handling
- [ ] User-friendly error messages

### Code Quality ✓

- [ ] Clean, modular code
- [ ] TypeScript best practices
- [ ] Clear folder structure
- [ ] Reusable components

### Deployment (Bonus) ✓

- [ ] AWS infrastructure as code
- [ ] Proper IAM roles
- [ ] Environment variables configured

---

## 🎯 Next Steps

**AWAITING YOUR APPROVAL TO START IMPLEMENTATION**

Once you approve this architecture and roadmap, I will:

1. ✅ Start with **Phase 1: Backend Foundation** (Steps 1.1-1.7)
2. ✅ Move to **Phase 2: Frontend Development** (Steps 2.1-2.8)
3. ✅ Finish with **Phase 3: Testing & Deployment** (Steps 3.1-3.3)

**Please review and let me know if you'd like any changes to the architecture or approach before we begin coding!** 🚀
