---
name: stock-lookup
description: Look up stock/company financial data, prediction markets, options flow, earnings, economic regime, portfolio holdings, and watchlists. Use when the user asks about a stock ticker, company financials, SEC filings, insider transactions, earnings, technicals, market data, prediction markets, economic regime, portfolio, or watchlist. Uses yfinance, SEC EDGAR, FRED, pandas-ta, Polymarket, Kalshi, CoinGecko.
---

# Stock Lookup Skill

Use this skill when the user asks about a specific stock ticker, company financials, market data, SEC filings, insider transactions, prediction markets, options flow, earnings, economic regime, portfolio holdings, or watchlists.

## CLI Tool: john-stock

### Company & Price Data
```bash
john-stock quote NVDA              # Quick quote + key ratios
john-stock financials NVDA         # Income statement, balance sheet, cash flow
john-stock insiders NVDA           # Recent insider transactions (Form 4)
john-stock sec NVDA                # Recent SEC filings (10-K, 10-Q, 8-K)
john-stock sec-facts NVDA          # XBRL company facts from SEC
john-stock technicals NVDA          # RSI, SMA, EMA, MACD, Bollinger, ATR
john-stock compare NVDA AMD INTC   # Side-by-side comparison table
john-stock chart NVDA              # Generate price chart PNG (6mo default)
john-stock chart NVDA --period 1y  # Different time period
john-stock chart NVDA --period 3mo --output ~/NVDA_chart.png
```

### Quant & Smart Money
```bash
john-stock options NVDA            # Options: IV, put/call ratio, unusual activity, analyst targets
john-stock earnings NVDA           # Earnings dates, surprise history, EPS trend, analyst estimates
john-stock flow NVDA               # Institutional holders, mutual funds, upgrades/downgrades
john-stock short NVDA               # Short interest, pct float, days to cover, squeeze potential
john-stock sectors                  # Sector rotation heatmap (11 SPDR ETFs vs SPY)
john-stock screener                 # Screen stocks by fundamentals (PE, sector, dividend, etc.)
john-stock screener --sector Tech --max-pe 25  # Filter by criteria
john-stock screener --min-rev-growth 30 --limit 10  # High-growth screen
john-stock screener --min-div 4 --max-pe 15  # Value/income screen
```

### Personal Terminal
```bash
john-stock portfolio init           # Create ~/.john-stock/portfolio.csv
john-stock portfolio add NVDA 10 1200  # Add/merge holding; cost basis is total $
john-stock portfolio show           # P/L, sector exposure, dividends, concentration risk
john-stock watchlist list           # Show default/custom watchlists
john-stock watchlist show ai        # Quote/performance table for a watchlist
john-stock watchlist add ai TSM ASML # Add tickers to persistent local list
john-stock watchlist remove ai TSLA # Remove tickers
john-stock watchlist scan ai        # RSI + 20d/50d signal scan
john-stock web                      # Launch local John Finance Terminal dashboard
```

### Macro & Prediction Markets
```bash
john-stock macro                   # Fed funds, 10Y, 2Y, CPI, unemployment, GDP, crypto
john-stock regime                  # Economic regime analysis (recession risk, yield curve)
john-stock news                    # Financial news headlines
john-stock forex                   # Major currency pairs (EUR/USD, GBP/USD, USD/JPY, etc.)
john-stock commodities             # Commodity futures (gold, oil, copper, corn, wheat, etc.)
john-stock bonds                   # Treasury yields, yield curve, credit spreads
john-stock polymarket              # Top Polymarket prediction markets by volume
john-stock polymarket --search btc # Search Polymarket by keyword
john-stock polymarket --tag crypto # Filter by tag
john-stock kalshi                  # Kalshi prediction markets (US-regulated)
john-stock kalshi --category economics  # Filter by category
```

All free, no API keys required. Uses:
- **yfinance** — quotes, financials, insiders, options, earnings, history
- **SEC EDGAR** — filings, XBRL company facts
- **FRED** — macro indicators (Fed funds, 10Y, 2Y, CPI, unemployment, S&P 500)
- **pandas-ta** — technical analysis (RSI, SMA, EMA, MACD, BB, ATR)
- **Polymarket** — prediction markets (crypto, politics, sports; public Gamma API)
- **Kalshi** — US-regulated prediction markets (economics, politics)
- **CoinGecko** — crypto prices (BTC, ETH, SOL)
- **matplotlib** — chart generation
- **feedparser** — financial news (MarketWatch, Yahoo Finance, Google News)

## Options Command Details

`john-stock options NVDA` provides:
- **Analyst targets**: mean, median, high, low price targets
- **Analyst consensus**: strong buy / buy / hold / sell breakdown
- **Put/Call ratio**: OI and volume ratios (bullish/bearish signal)
- **IV stats**: ATM IV, IV range, mean IV
- **Top OI strikes**: where the biggest bets are (calls + puts)
- **Unusual activity**: options with vol/OI > 3x (lightning bolt emoji)
- **Monthly expiry**: auto-selects nearest 14+ days expiry

## Earnings Command Details

`john-stock earnings NVDA` provides:
- **Upcoming dates**: next 3 earnings dates with EPS estimates
- **EPS trend**: analyst revision direction (current vs 7d/30d/60d/90d ago) with ↑↓ arrows
- **Analyst estimates**: avg/low/high/growth for next quarter and year
- **Surprise history**: actual vs estimate with beat/miss indicators
- **Price targets**: analyst consensus low/median/mean/high vs current price

## Flow Command Details

`john-stock flow NVDA` provides:
- **Ownership breakdown**: insiders %, institutions %, float %
- **Top 8 institutional holders**: BlackRock, Vanguard, etc. with position changes (↑↓)
- **Top 5 mutual fund holders**: with position changes
- **Recent analyst actions**: upgrades, downgrades, initiations, price targets

## Short Interest Command Details

`john-stock short NVDA` provides:
- **Shares short**, **short % of float**, **short ratio** (days to cover)
- **MoM change**: whether shorts are increasing or covering
- **Interpretation**: high short interest = squeeze catalyst; low = minimal bearish positioning

## Sector Rotation Details

`john-stock sectors` provides:
- **5-day performance** of 11 SPDR sector ETFs vs SPY baseline
- **Visual bar chart** (█ for gains, ░ for losses)
- **Leader/laggard** identification
- **Rotation signal**: strong/moderate/balanced based on spread between sectors

## Economic Regime (from Rico)

The `regime` command adapts Rico/Drew's FRED client regime classification:

| Regime | Signal | Implication |
|--------|--------|-------------|
| RECESSION_RISK | Yield curve inverted (10Y-2Y < 0) | Consider defensive positions |
| WEAK_ECONOMY | Unemployment > 6% | Cautious stance, look for value |
| HIGH_RATES | Fed Funds > 5% | Pressure on growth stocks, favor value/yield |
| LOW_RATES | Fed Funds < 1% | Easy money, growth stocks favored |
| NORMAL | No extreme signals | Standard risk management |

Note: FRED API can be rate-limited. If `regime` fails, use `macro` as fallback.

## Prediction Markets

**Polymarket** (global, crypto-native):
- Shows Yes/No probabilities for events
- Top markets by volume (elections, crypto, sports)
- Searchable by keyword (`--search`) or tag (`--tag`)

**Kalshi** (US-regulated, CFTC):
- US-focused: economics, elections, climate
- Filter by category: economics, politics, science, weather

## Alpha Extraction

```bash
chow-alpha "https://www.youtube.com/watch?v=..."  # Full alpha extraction
chow-alpha --no-llm "https://..."                   # Transcript only
```

## Analysis Framework

For any stock/company analysis, cover these systematically:

1. **Business model & moat** — How do they make money? What protects it?
2. **Financial health** — Revenue growth, margins, debt, cash flow, FCF yield
3. **Competitive landscape** — Market share, threats, switching costs
4. **Management & incentives** — Insider ownership, compensation alignment
5. **Valuation** — Relative to growth, peers, historic range, DCF sanity check
6. **Catalysts & risks** — What moves the stock? What breaks the thesis?
7. **Contrarian check** — What does the market miss? What's the bear case?
8. **Prediction market check** — What odds does Polymarket/Kalshi give for related events?
9. **Options flow check** — Unusual activity, put/call ratio, IV positioning
10. **Smart money flow** — Institutional holders changing positions? Analysts upgrading/downgrading?

## Data Freshness

- yfinance data can be 15 min delayed during market hours
- Options data: previous close (after-hours OI may be 0)
- SEC filings: same-day for 8-K, 2-5 days for 10-Q/10-K
- FRED macro: daily for rates, monthly for CPI/unemployment
- Polymarket/Kalshi: real-time (API, no auth needed)
- Institutional holdings: quarterly (13F filings, ~45 day lag)
- Always note data timestamps when presenting analysis