# CoinGecko API Testing - Curl Commands

## API Key
Replace `YOUR_API_KEY` with: `CG-UMSbWgGxjn3Hf1AGKHSztCWM`

---

## 1. Get Coins List
**Purpose**: Fetch all available cryptocurrencies with their IDs, symbols, and names

```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/list" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '.[:5]'  # Show first 5 coins
```

**Expected Response Structure**:
```json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin"
  },
  {
    "id": "ethereum",
    "symbol": "eth",
    "name": "Ethereum"
  }
]
```

---

## 2. Get Historical Market Data (Market Chart Range)
**Purpose**: Fetch historical price data for a specific coin within a date range

### Example 1: Bitcoin in USD (July 2025)
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=1719792000&to=1722470399" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{prices: .prices[:3], market_caps: .market_caps[:3], total_volumes: .total_volumes[:3]}'
```

**Date Conversion**:
- `from=1719792000` → July 1, 2025, 00:00:00 UTC
- `to=1722470399` → July 31, 2025, 23:59:59 UTC

**To convert dates to Unix timestamps**:
```bash
# July 1, 2025
date -j -f "%Y-%m-%d %H:%M:%S" "2025-07-01 00:00:00" "+%s"

# August 31, 2025
date -j -f "%Y-%m-%d %H:%M:%S" "2025-08-31 23:59:59" "+%s"
```

**Expected Response Structure**:
```json
{
  "prices": [
    [1719792000000, 61234.56],
    [1719795600000, 61345.78],
    [1719799200000, 61456.89]
  ],
  "market_caps": [
    [1719792000000, 1234567890123],
    [1719795600000, 1234678901234]
  ],
  "total_volumes": [
    [1719792000000, 12345678901],
    [1719795600000, 12456789012]
  ]
}
```

**Response Explanation**:
- Each array contains `[timestamp_in_milliseconds, value]`
- `prices`: Price of the coin at each timestamp
- `market_caps`: Total market capitalization
- `total_volumes`: Trading volume

### Example 2: Ethereum in EUR (August 2025)
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/ethereum/market_chart/range?vs_currency=eur&from=1722470400&to=1725148799" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{total_prices: (.prices | length), first_price: .prices[0], last_price: .prices[-1]}'
```

### Example 3: Solana in TRY (Full Period)
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=try&from=1719792000&to=1725148799" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{total_prices: (.prices | length), first_price: .prices[0], last_price: .prices[-1]}'
```

---

## 3. Get Coin Detail (For Metadata - Bonus Feature)
**Purpose**: Fetch detailed information about a specific coin including description and images

```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{id, symbol, name, description: .description.en[:200], image, links: {homepage: .links.homepage}}'
```

**Expected Response Structure**:
```json
{
  "id": "bitcoin",
  "symbol": "btc",
  "name": "Bitcoin",
  "description": {
    "en": "Bitcoin is the first successful internet money based on peer-to-peer technology..."
  },
  "image": {
    "thumb": "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
    "small": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    "large": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
  },
  "links": {
    "homepage": ["https://bitcoin.org/", "", ""]
  }
}
```

---

## 4. Test All Coins We're Using

### Bitcoin
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=1719792000&to=1722470399" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{coin: "bitcoin", prices_count: (.prices | length)}'
```

### Ethereum
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/ethereum/market_chart/range?vs_currency=usd&from=1719792000&to=1722470399" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{coin: "ethereum", prices_count: (.prices | length)}'
```

### Solana
```bash
curl -X GET "https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from=1719792000&to=1722470399" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  | jq '{coin: "solana", prices_count: (.prices | length)}'
```

---

## 5. Rate Limiting Test
**Test if you hit rate limits**:

```bash
# Run 5 requests quickly
for i in {1..5}; do
  echo "Request $i"
  curl -X GET "https://api.coingecko.com/api/v3/coins/list" \
    -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
    -w "\nHTTP Status: %{http_code}\n" \
    -o /dev/null -s
  sleep 1
done
```

**Expected**: 200 OK for all if within rate limits
**If rate limited**: 429 Too Many Requests

---

## Quick Reference: Date to Unix Timestamp

```bash
# July 1, 2025 00:00:00
echo "1719792000"

# July 31, 2025 23:59:59
echo "1722470399"

# August 1, 2025 00:00:00
echo "1722470400"

# August 31, 2025 23:59:59
echo "1725148799"
```

---

## Response Fields Explanation

### Market Chart Range Response:
- **prices**: Array of [timestamp, price] - Hourly price data
- **market_caps**: Array of [timestamp, market_cap] - Market capitalization over time
- **total_volumes**: Array of [timestamp, volume] - Trading volume over time

### Coin Detail Response:
- **id**: Unique identifier (used in API calls)
- **symbol**: Ticker symbol (e.g., "btc")
- **name**: Full name (e.g., "Bitcoin")
- **description.en**: English description of the coin
- **image**: URLs for different sizes of coin logo
- **links.homepage**: Official website URLs

---

## Tips for Testing:

1. **Use `jq` for pretty output**: Install with `brew install jq`
2. **Check HTTP status**: Add `-w "\nHTTP: %{http_code}\n"` to curl
3. **Save response to file**: Add `-o response.json`
4. **Verbose mode**: Add `-v` to see headers and debug info

```bash
# Example with all debugging
curl -v -X GET "https://api.coingecko.com/api/v3/coins/list" \
  -H "x-cg-demo-api-key: CG-UMSbWgGxjn3Hf1AGKHSztCWM" \
  -w "\nHTTP: %{http_code}\n" \
  -o response.json
```
