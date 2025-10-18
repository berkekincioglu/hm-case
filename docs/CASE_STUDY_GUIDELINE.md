Fullstack Developer Case Study
Overview
Develop a user-friendly Cryptocurrency Price Dashboard that consumes data
from the CoinGecko API via a custom backend service. The application should allow
users to view historical cryptocurrency data with filtering and aggregation capabilities.
Objective
Build a fullstack application with a frontend that communicates only with a custom
backend API (not directly with CoinGecko), and provides the following:

-A dashboard with a chart and a data table
-Filtering and breakdown capabilities by Coin, Currency, and Date
-Granular control of data (daily vs hourly) based on selected date range
-Data visualization and interaction via chart and table components

Project Requirements
Technical Requirements

-Scheduled Data Fetching (Backend):
Create a scheduled background task that regularly fetches data from the
CoinGecko API and stores it in a database.
-Database:
Store pricing data in a database that supports both daily and hourly
granularity. You can use a relational database (e.g., SQLite, PostgreSQL) or a
cloud-based solution such as Amazon S3 + Athena.
-Backend API:
Develop a RESTful API that:
o Exposes endpoints to retrieve coins, currencies, and price data
o Performs necessary filtering, grouping, and aggregation based on the
selected dimensions
o Serves data exclusively to the frontend (CoinGecko must not be called
directly from the client)

Frontend Interface:
o Built with React.js and TypeScript
o Fetches data exclusively from your custom API
o Contains:
-A chart for visual data
-A table for detailed listings
-Filters (coin, currency, date range, and breakdown dimensions)
-A login page (credentials can be hardcoded)

Pages & Features

1. Login Page
   -Simple, static login screen to access the dashboard.
   -Hardcoded credentials are sufficient.

2. Dashboard Page (CryptoPage)
   Contains two main components:
   A. Chart Component
   -Always uses Date as the X-axis.
   -Shows:
   o Daily average prices by default
   o Hourly prices if the selected date range is 2 days or less

-Allows users to select a range using mouse interaction
-If the selected range is ≤ 2 days, it automatically switches to the hourly view
-If no breakdown dimension is selected, it displays the average price per date
across all records

B. Table Component
-Adapts to selected dimensions (Coin, Currency, Date)
Behavior:
o If only Date is selected → show average price per day
o If Coin, Currency, or combinations is selected → show price per unique group
o If only Coin or Currency is selected → show only Coin - Price or Currency - Price data
Features:
o Sortable columns (by clicking headers)

Functional Requirements

-Coin Selection:
Dropdown to select one or multiple cryptocurrencies (fetched from backend). Default is BTC, ETH, DOGE
-Currency Selection:
Dropdown to select one or multiple currencies (e.g., USD, EUR, GBP). Default is USD, TRY.
-Date Range Picker:
Allows selection of a custom time range
o When the user shortens the range to 2 days or less (via picker or
chart), switches to hourly granularity

-Breakdown (Dimension) Selection:
o User can select one or more of the following: Coin, Currency, Date
o If only Date is selected:
-The chart shows the average price per day
-The table shows aggregated data
o If multiple dimensions are selected:
-Chart displays a line for each unique combination (e.g.,BTC/USD)
-The table displays rows accordingly
Note:
-Filters are used to narrow down which data is fetched (e.g., only BTC and USD).
-Breakdown dimensions control how the data is grouped (e.g., group by Coin and Date).
-API Communication:
o Frontend communicates only with the backend API
o Backend fetches data from its own database
o No direct calls to CoinGecko from the client
-Error Handling:
Display user-friendly messages for:
o No data
o Backend/API errors
o Invalid inputs
-Loading Indicators:
Show a visual indicator while data is loading

Non-Functional Requirements
-Performance:
Fast API response times and smooth frontend rendering
-Responsiveness:
Desktop-friendly layout with good usability
-User Experience:
Clear feedback, clean UI, and logical interactions

Technologies and Tools

-Frontend: React.js + TypeScript
-Backend API: Custom-built (any language) (Typescript preferred)
-API Client: Axios or Fetch API
-Date Handling: JavaScript Date API or Moment.js
-Database: SQLite, PostgreSQL, or cloud-based (e.g., S3 + Athena)
-External API: CoinGecko (used only by backend)

CoinGecko API Overview

-Sign Up: Create a free CoinGecko account and obtain an API key
-Key Endpoints:
o List of coins: GET /api/v3/coins/list
o Historical price data: GET /api/v3/coins/{id}/market_chart/range
Parameters: vs_currency, from, to

Application Flow

-Backend 1. Fetch & Store Data:
o You are expected to implement a scheduled fetcher, but for the
purpose of this case study, you do not need to run it continuously. A
one-time data pull covering July–August 2025 with USD, TRY, EUR,
GBP currencies is sufficient.
o For the purpose of this case study, it is not required to fetch data for all
available cryptocurrencies. You may limit your implementation to a
predefined list of major coins (e.g., Bitcoin, Ethereum, Solana, etc.) to
ensure performance and relevance.
o You are expected to have at least 10 major coins.
o Save to the database with appropriate granularity 2. Serve API:
o Expose endpoints for:
-Fetching coins and currencies
-Querying price data with filters and breakdown
-Grouping and aggregating results as needed

Frontend 1. Page Load:
o Fetch coin/currency list from backend
o Display filter UI 2. User Interaction:
o User selects coin(s), currency, date range, and breakdown dimensions
o Sends request to backend API 3. Data Handling:
o Backend returns processed and aggregated data
o Frontend renders:
Chart (daily or hourly view)
Table (grouped by selected dimensions) 4. Interactivity:
o Chart range selection dynamically adjusts granularity
o Table supports sorting, column reordering, and pagination

Evaluation Criteria for Candidates

-Database Design and Querying:
Ability to design an efficient database schema supporting both daily and
hourly granularity, and perform complex queries and aggregations based on
multiple dimensions (Coin, Currency, Date).
-API Integration:
Skill in integrating with the public CoinGecko API exclusively on the backend,
handling API requests, errors, and data parsing correctly without exposing the
external API to the frontend.
Frontend User Interface and User Experience:
Creation of an intuitive and user-friendly dashboard, ensuring data is clearly
displayed both in charts and tables, with smooth interaction for filtering,
sorting, and pagination.
-State Management:
Effective handling of application state, including user selections, loading
indicators, and error states, ensuring a seamless experience.
Error Handling and Edge Cases:
Robust handling of possible errors such as no data scenarios, invalid inputs,
and network failures, providing meaningful feedback to users.
Code Quality and Best Practices:
Clean, modular, and maintainable code adhering to modern React and
TypeScript best practices, including clear folder structures and reusable
components.
-Deployment and Infrastructure (Bonus):
Use of AWS infrastructure as code (CDK or Serverless Framework) for
deploying backend and frontend, demonstrating understanding of cloud
resources, security roles, and environment configurations.

Submission Requirements
-A public URL of the deployed application
-A GitHub repository containing:
o Full source code (frontend + backend)
o CDK/Serverless configuration if applicable (e.g., cdk.json,
serverless.yml)
o Clear folder structure - README explaining deployment steps and any AWS usage (optional but preferred)

Expectations:
-Logical resource definitions (e.g., S3 for frontend, Lambda/API Gateway for backend)
-Correct IAM roles/policies
-Use of environment variables and API keys  
 -Separation of infrastructure components where applicable

Bonus Feature – Coin Metadata Tooltip (Optional)
-As an optional UI enhancement, candidates may include hoverable
tooltips on coin symbols (e.g., BTC, ETH) displayed in the table or chart.

This tooltip can display coin metadata such as:
o Coin name
o Symbol
o Description (short)
o Image (optional)
●This metadata can be fetched from CoinGecko using the following
endpoint:
o GET /api/v3/coins/{id}
●It should be stored and served via the backend (not fetched directly
from CoinGecko in the frontend).
●Example usage: When hovering over "BTC" in the table, a small
popup shows "Bitcoin – The original cryptocurrency launched in
2009..." etc.
