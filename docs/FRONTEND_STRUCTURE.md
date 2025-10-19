We need components folder for the components, do not hesitate to generate components. the code should be readable , clean and solid.
for data fetching operations if we are not using ssr you can fetch data via react-query in client components. our backend is in api folder so you can look up which
endpoint should we use.

Always check case-study-guideline.md and care the requests and evaluations criteria.

I added theme colors from shadcn in global.css we can use that theme colors. this app will be cryptocurrency dashboard so add nice green and red color for the chart views like in the binance or tradingmarket.

Use shadcn components always.

State Management:
Effective handling of application state, including user selections, loading
indicators, and error states, ensuring a seamless experience.
We will use react context for the state management. you can generate seperate folder for context files. also generate a global provider to wrap the parent component.

Frontend User Interface and User Experience:
Creation of an intuitive and user-friendly dashboard, ensuring data is clearly
displayed both in charts and tables, with smooth interaction for filtering,
sorting, and pagination.

src/
├── app/
│ ├── (auth)/
│ │ └── login/
│ │ └── page.tsx # Login page
│ ├── (dashboard)/
│ │ └── dashboard/
│ │ └── page.tsx # Main dashboard
│ ├── layout.tsx # Root layout with providers
│ └── globals.css
│
├── components/
│ ├── ui/ # shadcn/ui components
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── select.tsx
│ │ ├── card.tsx
│ │ ├── table.tsx
│ │ ├── tooltip.tsx
│ │ └── ...
│ │
│ ├── auth/
│ │ └── login-form.tsx # Login form component
│ │
│ ├── dashboard/
│ │ ├── filters/
│ │ │ ├── coin-selector.tsx
│ │ │ ├── currency-selector.tsx
│ │ │ ├── date-range-picker.tsx
│ │ │ └── breakdown-selector.tsx
│ │ │
│ │ ├── chart/
│ │ │ ├── price-chart.tsx # Main chart component
│ │ │ └── chart-legend.tsx
│ │ │
│ │ ├── table/
│ │ │ ├── price-table.tsx # Main table component
│ │ │ └── coin-tooltip.tsx # Hoverable metadata tooltip
│ │ │
│ │ └── dashboard-header.tsx # Header with logout
│ │
│ └── shared/
│ ├── loading-spinner.tsx
│ ├── error-message.tsx
│ └── no-data.tsx
│
├── contexts/
│ ├── auth-context.tsx # Authentication state
│ ├── dashboard-context.tsx # Dashboard filters & state
│ └── providers.tsx # Global provider wrapper
│
├── hooks/
│ ├── use-prices.ts # React Query hook for prices
│ ├── use-coins.ts # React Query hook for coins
│ ├── use-currencies.ts # React Query hook for currencies
│ ├── use-coin-metadata.ts # React Query hook for metadata
│ └── use-auth.ts # Auth context hook
│
├── lib/
│ ├── api/
│ │ ├── client.ts # Axios instance with config
│ │ ├── endpoints.ts # API endpoint definitions
│ │ └── types.ts # API response types
│ │
│ └── utils/
│ ├── date-utils.ts # Date formatting, calculations
│ ├── chart-utils.ts # Chart data transformation
│ └── cn.ts # Tailwind class merger
│
└── types/
├── dashboard.ts # Dashboard-specific types
├── chart.ts # Chart data types
└── api.ts # API response types
